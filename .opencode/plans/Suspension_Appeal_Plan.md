# Suspension & Appeal Plan

## Overview

Implement instant force-logout when admin suspends an agent, show suspension info on re-login, and provide a dedicated appeal submission flow.

## Flow

```
Admin clicks Suspend (web) → PATCH /v1/agents/{id}/suspend
  ↓
Backend: sets Agent.Status=Inactive, User.Status=Inactive,
         Agent.SuspendedAt=UtcNow, Agent.SuspensionReason=reason
  ↓
Backend: saves Notification to DB + pushes SignalR event to user group
  ↓
Mobile app SignalR receives "Notification" event with title "Account Suspended"
  ↓
Mobile app: shows Alert with reason, then calls logout()
  ↓
User sees login screen
  ↓
User logs in (OTP) → backend returns 200 with status='Inactive' + suspensionReason + suspendedAt
  ↓
RootNavigator routes isAuthenticated=true, status='Inactive' → SuspendedScreen
  ↓
SuspendedScreen shows suspension info card (reason + date)
  ↓
User taps "Submit Appeal" → navigates to AppealScreen (modal)
  ↓
User writes appeal + submits → POST /v1/support/tickets
  ↓
Shows success confirmation
```

---

## Part 1: Backend Changes

### File 1: `FoodBridge.Domain/Entities/DeliveryAgent.cs`

Add two new properties after `TotalDeliveries`:

```csharp
public DateTime? SuspendedAt { get; set; }
public string? SuspensionReason { get; set; }
```

### File 2: `FoodBridge.Application/DTOs/Auth/VerifyOtpResponseDto.cs`

Add two new properties:

```csharp
public string? SuspensionReason { get; set; }
public DateTime? SuspendedAt { get; set; }
```

### File 3: `FoodBridge.Application/Features/Agents/Commands/SuspendAgent/SuspendAgentCommandHandler.cs`

**Changes:**
1. Inject `INotificationService` into the constructor
2. After `agent.IsAvailable = false;`, set:
   ```csharp
   agent.SuspendedAt = DateTime.UtcNow;
   agent.SuspensionReason = reason;
   ```
3. Replace the manual `_db.Notifications.Add(...)` + `_db.AuditLogs.Add(...)` pattern with `_notificationService.SendToUserAsync(...)` for the user notification, and keep the AuditLog for the admin record
4. After `_db.SaveChangesAsync(ct)`, the notification is persisted AND pushed via SignalR

**Full file after changes:**

```csharp
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Agents.Commands.SuspendAgent;

public class SuspendAgentCommandHandler
    : IRequestHandler<SuspendAgentCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;

    public SuspendAgentCommandHandler(IAppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task<Unit> Handle(SuspendAgentCommand request, CancellationToken ct)
    {
        var agent = await _db.DeliveryAgents
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == request.AgentId, ct)
            ?? throw new NotFoundException("Delivery agent not found.");

        if (agent.Status != AgentStatus.Active)
            throw new BadRequestException(
                $"Agent is {agent.Status.ToString().ToLowerInvariant()}. Only active agents can be suspended.");

        var reason = request.Reason ?? "No reason provided.";

        agent.Status = AgentStatus.Inactive;
        agent.User.Status = UserStatus.Inactive;
        agent.IsAvailable = false;
        agent.SuspendedAt = DateTime.UtcNow;
        agent.SuspensionReason = reason;

        // Send notification (saves to DB + pushes via SignalR)
        await _notificationService.SendToUserAsync(
            agent.UserId,
            "Account Suspended",
            $"Your delivery agent account has been suspended. Reason: {reason}",
            new { status = "Inactive", reason },
            NotificationType.System,
            ct);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = request.AdminUserId,
            Action = AuditAction.Update,
            EntityName = "DeliveryAgent",
            EntityId = agent.Id.ToString(),
            Details = $"Delivery agent '{agent.User.FullName ?? agent.User.MobileNumber}' suspended. Reason: {reason}"
        });

        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
```

### File 4: `FoodBridge.Application/Features/Auth/Commands/VerifyOtp/VerifyOtpCommandHandler.cs`

In the section where the agent is fetched and status is determined (after line 100, before line 119 in current file), populate the suspension fields:

```csharp
if (agent is not null)
{
    status = agent.Status.ToString();
    // ... existing Banned check stays ...

    // NEW: populate suspension info for the response DTO
    // This is set before the response is built at the bottom of the method
}
```

At the bottom where `VerifyOtpResponseDto` is returned (around line 141-155), add:
```csharp
return new VerifyOtpResponseDto
{
    UserId = user.Id,
    FullName = user.FullName ?? string.Empty,
    MobileNumber = user.MobileNumber!,
    Role = user.Role.ToString(),
    StaffRole = user.StaffUser != null
        ? user.StaffUser.StaffRole.ToString().ToLower()
        : null,
    Status = status,
    // NEW fields:
    SuspensionReason = agent?.SuspensionReason,
    SuspendedAt = agent?.SuspendedAt,
    AccessToken = accessToken,
    RefreshToken = refreshToken,
    ExpiresIn = 60,
    IsNewUser = isNewUser
};
```

Note: `agent` is the variable from the `if (user.Role == UserRole.DeliveryAgent)` block. It may be `null` if the user is not a delivery agent. Use null-conditional access: `agent?.SuspensionReason`.

**IMPORTANT**: The `agent` variable is scoped inside the `if (user.Role == UserRole.DeliveryAgent)` block. To use it at the bottom, declare it outside:
```csharp
DeliveryAgent? agent = null;
if (user.Role == UserRole.DeliveryAgent)
{
    agent = await _db.DeliveryAgents
        .FirstOrDefaultAsync(a => a.UserId == user.Id, ct);
    // ... rest of the block ...
}
```

### File 5: `FoodBridge.Infrastructure/Services/NotificationService.cs`

**Changes:**
1. Add using: `using Microsoft.AspNetCore.SignalR;`
2. Add using: `using FoodBridge.Infrastructure.Hubs;`
3. Inject `IHubContext<NotificationHub>` into constructor
4. In `SendToUserAsync`, after `_db.SaveChangesAsync(ct)` and before `return notification.Id`, add:

```csharp
// Push real-time event via SignalR
try
{
    await _hubContext.Clients
        .Group($"user_{userId}")
        .SendAsync("Notification", new
        {
            title,
            body,
            type = type.ToString(),
            data
        }, ct);
}
catch
{
    // SignalR push is best-effort — log silently
}
```

**Full constructor change:**
```csharp
private readonly AppDbContext _db;
private readonly IConfiguration _config;
private readonly IHubContext<NotificationHub> _hubContext;

public NotificationService(
    AppDbContext db,
    IConfiguration config,
    IHubContext<NotificationHub> hubContext)
{
    _db = db;
    _config = config;
    _hubContext = hubContext;
    // Initialize Firebase once
}
```

### File 6: EF Migration

Run the migration command from AGENTS.md to add the new `SuspendedAt` and `SuspensionReason` columns to the `DeliveryAgents` table:

```powershell
cd DotNetBackedLatest
dotnet ef migrations add AddSuspensionFieldsToDeliveryAgent --project FoodBridge.Infrastructure\FoodBridge.Infrastructure.csproj --startup-project FoodBridge.API\FoodBridge.API.csproj
dotnet ef database update --project FoodBridge.Infrastructure\FoodBridge.Infrastructure.csproj --startup-project FoodBridge.API\FoodBridge.API.csproj
```

---

## Part 2: Frontend Mobile Changes

### File 7: `FoodBridgeDeliveryApp/src/types/auth.types.ts`

Add `suspensionReason` and `suspendedAt` to the `AuthResponse.agent` object:

```typescript
export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  agent: {
    id: string;
    fullName: string;
    mobileNumber: string;
    status: string;
    suspensionReason?: string;
    suspendedAt?: string;
  };
}
```

### File 8: `FoodBridgeDeliveryApp/src/stores/auth.store.ts`

**Changes:**
1. Add `suspensionReason` and `suspendedAt` to the `AuthState` interface
2. Add these to initial state (null)
3. Update `setAuth` to populate them from `res.agent.suspensionReason` / `res.agent.suspendedAt`
4. Update `logout` to reset them to null
5. Update `hydrate` and `partialize` to persist/restore them

```typescript
// In AuthState interface:
suspensionReason: string | null;
suspendedAt: string | null;

// In initial state:
suspensionReason: null,
suspendedAt: null,

// In setAuth:
suspensionReason: res.agent.suspensionReason ?? null,
suspendedAt: res.agent.suspendedAt ?? null,

// In logout:
suspensionReason: null,
suspendedAt: null,

// In hydrate:
suspensionReason: parsed.state?.suspensionReason ?? null,
suspendedAt: parsed.state?.suspendedAt ?? null,

// In partialize:
suspensionReason: state.suspensionReason,
suspendedAt: state.suspendedAt,
```

### File 9: `FoodBridgeDeliveryApp/src/hooks/useAuth.ts`

In the `verifyOtp` function, pass the new fields:

```typescript
setAuth({
  token: d.accessToken,
  refreshToken: d.refreshToken,
  expiresAt: new Date(Date.now() + (d.expiresIn || 60) * 1000).toISOString(),
  agent: {
    id: d.userId,
    fullName: d.fullName,
    mobileNumber: d.mobileNumber,
    status: d.status ?? 'Active',
    suspensionReason: d.suspensionReason,
    suspendedAt: d.suspendedAt,
  },
});
```

Note: The snake_case→camelCase interceptor in `client.ts` already transforms `suspension_reason` → `suspensionReason` and `suspended_at` → `suspendedAt` automatically.

### File 10: `FoodBridgeDeliveryApp/src/services/signalr.service.ts`

Add a listener for the `"Notification"` event that checks if it's a suspension notification and force-logouts:

After the `connection.on('taskUpdate', ...)` handler (line 80-82), add:

```typescript
connection.on('Notification', (data: {title: string; body: string; type: string}) => {
  if (data.title === 'Account Suspended') {
    // Show alert so user knows why they were logged out
    Alert.alert('Account Suspended', data.body, [
      {text: 'OK', onPress: () => useAuthStore.getState().logout()},
    ]);
  }
});
```

Add `Alert` to the import from `react-native`:
```typescript
import {Alert} from 'react-native';
```

### File 11: `FoodBridgeDeliveryApp/src/types/navigation.types.ts`

Add `Appeal` screen to `RootStackParamList`:

```typescript
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  AwaitingApproval: undefined;
  Suspended: undefined;
  Rejected: undefined;
  Banned: undefined;
  Appeal: {suspensionReason?: string; suspendedAt?: string};
  OfferModal: {offer: DispatchOffer};
};
```

### File 12: `FoodBridgeDeliveryApp/src/screens/auth/SuspendedScreen.tsx`

**Replace the entire file.** The new SuspendedScreen shows suspension info and has a "Submit Appeal" button that navigates to AppealScreen (instead of inline form).

Key changes:
1. Import `useNavigation` from `@react-navigation/native`
2. Import `NativeStackNavigationProp` from `@react-navigation/native-stack`
3. Import `RootStackParamList` from navigation types
4. Read `suspensionReason` and `suspendedAt` from `useAuthStore`
5. Remove inline appeal form state and logic
6. Show info card with reason + date
7. "Submit Appeal" button → `navigation.navigate('Appeal', { suspensionReason, suspendedAt })`
8. Keep "Logout" button

```typescript
import React from 'react';
import {View, Text} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {Button} from '@/components/ui/Button';
import {useAuthStore} from '@/stores/auth.store';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/types/navigation.types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const SuspendedScreen: React.FC = () => {
  const {colors, spacing, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const logout = useAuthStore(s => s.logout);
  const suspensionReason = useAuthStore(s => s.suspensionReason);
  const suspendedAt = useAuthStore(s => s.suspendedAt);
  const navigation = useNavigation<Nav>();

  const formattedDate = suspendedAt
    ? new Date(suspendedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + spacing.huge,
        paddingBottom: insets.bottom,
        paddingHorizontal: spacing.xl,
      }}>
      <View style={{alignItems: 'center', marginBottom: spacing.xxxl}}>
        <Text style={{fontSize: 48, marginBottom: spacing.lg}}>⚠️</Text>
        <Text
          style={[
            typography.h1,
            {color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center'},
          ]}>
          Account Suspended
        </Text>
        <Text
          style={[
            typography.body,
            {color: colors.textSecondary, textAlign: 'center', lineHeight: 22},
          ]}>
          Your account has been suspended. Please submit an appeal to request
          reinstatement.
        </Text>
      </View>

      {/* Suspension Info Card */}
      <View
        style={{
          backgroundColor: colors.surfaceVariant,
          padding: spacing.lg,
          borderRadius: 12,
          marginBottom: spacing.xxl,
        }}>
        {suspensionReason && (
          <>
            <Text
              style={[
                typography.labelSmall,
                {color: colors.textSecondary, marginBottom: spacing.xs},
              ]}>
              Reason
            </Text>
            <Text
              style={[
                typography.body,
                {color: colors.textPrimary, fontWeight: '500', marginBottom: spacing.md},
              ]}>
              {suspensionReason}
            </Text>
          </>
        )}
        {formattedDate && (
          <>
            <Text
              style={[
                typography.labelSmall,
                {color: colors.textSecondary, marginBottom: spacing.xs},
              ]}>
              Suspended On
            </Text>
            <Text
              style={[
                typography.body,
                {color: colors.textPrimary, fontWeight: '500'},
              ]}>
              {formattedDate}
            </Text>
          </>
        )}
      </View>

      <Button
        title="Submit Appeal"
        onPress={() => navigation.navigate('Appeal', {suspensionReason: suspensionReason ?? undefined, suspendedAt: suspendedAt ?? undefined})}
        size="lg"
        style={{marginBottom: spacing.md}}
      />

      <Button
        title="Logout"
        onPress={logout}
        variant="ghost"
        size="lg"
      />
    </View>
  );
};
```

### File 13: **Create** `FoodBridgeDeliveryApp/src/screens/auth/AppealScreen.tsx`

New screen. Shows the suspension reason (pre-filled info) + a text input for the user's appeal message + "Submit Appeal" button.

After successful submission, shows a confirmation card instead of the form.

```typescript
import React, {useState} from 'react';
import {View, Text, TextInput, Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {Button} from '@/components/ui/Button';
import {supportApi} from '@/api/support.api';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '@/types/navigation.types';

type AppealRoute = RouteProp<RootStackParamList, 'Appeal'>;

export const AppealScreen: React.FC = () => {
  const {colors, spacing, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<AppealRoute>();
  const {suspensionReason} = route.params ?? {};

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    try {
      await supportApi.createTicket('Appeal - Suspension Review', message.trim());
      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Failed to submit appeal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom,
        paddingHorizontal: spacing.xl,
      }}>
      {/* Header */}
      <View style={{marginBottom: spacing.xxl}}>
        <Text
          style={[
            typography.h2,
            {color: colors.textPrimary, marginBottom: spacing.sm},
          ]}>
          Submit Appeal
        </Text>
        <Text
          style={[
            typography.body,
            {color: colors.textSecondary, lineHeight: 22},
          ]}>
          {suspensionReason
            ? `Reason for suspension: ${suspensionReason}`
            : 'Explain why your account should be reinstated.'}
        </Text>
      </View>

      {submitted ? (
        <View
          style={{
            backgroundColor: colors.surfaceVariant,
            padding: spacing.lg,
            borderRadius: 12,
          }}>
          <Text
            style={[
              typography.body,
              {color: colors.textPrimary, textAlign: 'center', fontWeight: '600'},
            ]}>
            Appeal Submitted
          </Text>
          <Text
            style={[
              typography.labelSmall,
              {color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm},
            ]}>
            Our support team will review your appeal and notify you of the decision.
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="ghost"
            size="md"
            style={{marginTop: spacing.lg}}
          />
        </View>
      ) : (
        <>
          <TextInput
            style={{
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderRadius: 8,
              padding: spacing.md,
              fontSize: 15,
              minHeight: 160,
              textAlignVertical: 'top',
              borderWidth: 1,
              borderColor: colors.borderLight,
              marginBottom: spacing.lg,
            }}
            placeholder="Write your appeal here..."
            placeholderTextColor={colors.textDisabled}
            multiline
            value={message}
            onChangeText={setMessage}
            editable={!isSubmitting}
          />

          <Button
            title={isSubmitting ? 'Submitting...' : 'Submit Appeal'}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!message.trim() || isSubmitting}
            size="lg"
            style={{marginBottom: spacing.md}}
          />

          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="ghost"
            size="lg"
          />
        </>
      )}
    </View>
  );
};
```

### File 14: `FoodBridgeDeliveryApp/src/navigation/RootNavigator.tsx`

Two changes:
1. Import `AppealScreen` from `@/screens/auth/AppealScreen`
2. Add `Appeal` screen to the modal group

```typescript
import {AppealScreen} from '@/screens/auth/AppealScreen';

// In the modal group:
<RootStack.Group screenOptions={{presentation: 'modal'}}>
  <RootStack.Screen name="OfferModal" component={OfferModal} />
  <RootStack.Screen name="Appeal" component={AppealScreen} />
</RootStack.Group>
```

---

## Verification

### Backend
```powershell
cd DotNetBackedLatest
dotnet build FoodBridge.API\FoodBridge.API.csproj
```

### Frontend Mobile
```powershell
cd FoodBridgeDeliveryApp
npx tsc --noEmit
```

---

## Files Modified/Created Summary

| # | File | Action |
|---|------|--------|
| 1 | `FoodBridge.Domain/Entities/DeliveryAgent.cs` | Edit: +2 fields |
| 2 | `FoodBridge.Application/DTOs/Auth/VerifyOtpResponseDto.cs` | Edit: +2 fields |
| 3 | `FoodBridge.Application/Features/Agents/Commands/SuspendAgent/SuspendAgentCommandHandler.cs` | Edit: inject INotificationService, set SuspendedAt/SuspensionReason, use service for notification |
| 4 | `FoodBridge.Application/Features/Auth/Commands/VerifyOtp/VerifyOtpCommandHandler.cs` | Edit: declare agent var outside block, populate SuspensionReason/SuspendedAt |
| 5 | `FoodBridge.Infrastructure/Services/NotificationService.cs` | Edit: inject IHubContext, push SignalR event |
| 6 | EF Migration | New: `AddSuspensionFieldsToDeliveryAgent` |
| 7 | `FoodBridgeDeliveryApp/src/types/auth.types.ts` | Edit: +2 fields in AuthResponse |
| 8 | `FoodBridgeDeliveryApp/src/stores/auth.store.ts` | Edit: +2 state fields |
| 9 | `FoodBridgeDeliveryApp/src/hooks/useAuth.ts` | Edit: pass fields to setAuth |
| 10 | `FoodBridgeDeliveryApp/src/services/signalr.service.ts` | Edit: add Notification listener → Alert + logout |
| 11 | `FoodBridgeDeliveryApp/src/types/navigation.types.ts` | Edit: add Appeal screen |
| 12 | `FoodBridgeDeliveryApp/src/screens/auth/SuspendedScreen.tsx` | Edit: info card + button → AppealScreen |
| 13 | `FoodBridgeDeliveryApp/src/screens/auth/AppealScreen.tsx` | **Create**: appeal form screen |
| 14 | `FoodBridgeDeliveryApp/src/navigation/RootNavigator.tsx` | Edit: import + add Appeal to modal group |
