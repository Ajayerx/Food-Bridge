# Agent Suspend / Status Routing Implementation Plan

## Overview
Fix two issues: (1) already-logged-in suspended users are not force-logged-out, and (2) suspended users see only a warning text at OTP screen with no way to submit an appeal.

## Backend Change

### File: `DotNetBackedLatest/FoodBridge.Application/Features/Auth/Commands/VerifyOtp/VerifyOtpCommandHandler.cs`

Remove `ForbiddenException` throws for `Inactive`, `Pending`, and `Rejected` agent statuses (lines 104-118). Keep only the `Banned` check.

**Before:**
```csharp
if (agent.Status == AgentStatus.Banned)
    throw new ForbiddenException("Your account has been banned...");

if (agent.Status == AgentStatus.Inactive)
    throw new ForbiddenException("Your account has been suspended...");

if (agent.Status == AgentStatus.Pending)
    throw new ForbiddenException("Your delivery agent profile is pending approval...");

if (agent.Status == AgentStatus.Rejected)
    throw new ForbiddenException("Your delivery agent registration has been rejected...");
```

**After:**
```csharp
if (agent.Status == AgentStatus.Banned)
    throw new ForbiddenException("Your account has been banned...");
// Inactive, Pending, Rejected — allow authentication so frontend can route to appropriate screen
```

The `status` variable is already populated at line 102 (`status = agent.Status.ToString();`) and returned in `VerifyOtpResponseDto.Status`.

---

## Frontend Mobile Changes

### 1. `src/types/navigation.types.ts`

Add to `RootStackParamList`:
```typescript
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Suspended: undefined;
  Rejected: undefined;
  Banned: undefined;
  OfferModal: {offer: DispatchOffer};
};
```

### 2. `src/navigation/RootNavigator.tsx`

Import new screens. Update rendering logic:
```tsx
import {SuspendedScreen} from '@/screens/auth/SuspendedScreen';
import {RejectedScreen} from '@/screens/auth/RejectedScreen';
import {BannedScreen} from '@/screens/auth/BannedScreen';
import {useStatusMonitor} from '@/hooks/useStatusMonitor';

// Inside component:
const status = useAuthStore(s => s.status);
useStatusMonitor(); // periodic check for suspension while active

// In the navigator:
{isAuthenticated ? (
  status === 'Active' ? (
    <RootStack.Screen name="Main" component={MainNavigator} />
  ) : status === 'Inactive' ? (
    <RootStack.Screen name="Suspended" component={SuspendedScreen} />
  ) : status === 'Pending' ? (
    <RootStack.Screen name="AwaitingApproval" component={AwaitingApprovalScreen} />
  ) : status === 'Rejected' ? (
    <RootStack.Screen name="Rejected" component={RejectedScreen} />
  ) : status === 'Banned' ? (
    <RootStack.Screen name="Banned" component={BannedScreen} />
  ) : (
    <RootStack.Screen name="Auth" component={AuthNavigator} />
  )
) : (
  <RootStack.Screen name="Auth" component={AuthNavigator} />
)}
```

### 3. Create `src/screens/auth/SuspendedScreen.tsx`

- Shows icon (⚠️ or similar)
- Title: "Account Suspended"
- Body: "Your account has been suspended. Submit an appeal below to request reinstatement."
- TextInput for appeal message
- "Submit Appeal" button → calls `POST /v1/support/tickets` with `{ subject: "Appeal - Suspension Review", message: (user input) }`
- Disabled while submitting, success/error feedback
- "Logout" button

### 4. Create `src/screens/auth/RejectedScreen.tsx`

- Icon: ❌
- Title: "Registration Rejected"
- Body: "Your delivery agent registration has been rejected."
- "Contact Support" button
- "Logout" button

### 5. Create `src/screens/auth/BannedScreen.tsx`

- Icon: 🚫
- Title: "Account Banned"
- Body: "Your account has been permanently banned. This decision is final."
- "Logout" button only

### 6. Create `src/api/support.api.ts`

```typescript
import api from './client';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

export const supportApi = {
  createTicket: (subject: string, message: string, orderId?: string) =>
    api.post<ApiResponse<{id: string}>>('/support/tickets', {
      subject,
      message,
      order_id: orderId || null,
    }),
};
```

### 7. Create `src/hooks/useStatusMonitor.ts`

```typescript
import {useEffect, useRef, useCallback} from 'react';
import {AppState} from 'react-native';
import {useAuthStore} from '@/stores/auth.store';
import {agentApi} from '@/api/agent.api';
import {AgentStatus} from '@/types/agent.types';

export function useStatusMonitor() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const status = useAuthStore(s => s.status);
  const logout = useAuthStore(s => s.logout);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await agentApi.getProfile();
      const profileStatus = res.data?.data?.status;
      if (profileStatus && profileStatus !== AgentStatus.Active) {
        logout();
      }
    } catch {
      // network errors silently ignored
    }
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated || status !== AgentStatus.Active) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Check on mount
    checkStatus();

    // Periodic check every 60s
    intervalRef.current = setInterval(checkStatus, 60_000);

    // Check on app foreground
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        checkStatus();
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [isAuthenticated, status, checkStatus]);
}
```

### 8. `src/screens/auth/AwaitingApprovalScreen.tsx`

Replace the "Go to Login" link at bottom with a "Logout" button that calls `useAuthStore(s => s.logout)()`.

---

## Order of Implementation

1. Backend: Edit `VerifyOtpCommandHandler.cs` (remove 3 ForbiddenException blocks)
2. Build backend → `dotnet build`
3. Frontend: Edit `navigation.types.ts` (add Suspended, Rejected, Banned)
4. Frontend: Edit `RootNavigator.tsx` (status routing + useStatusMonitor)
5. Frontend: Create `SuspendedScreen.tsx`
6. Frontend: Create `RejectedScreen.tsx`
7. Frontend: Create `BannedScreen.tsx`
8. Frontend: Create `support.api.ts`
9. Frontend: Create `useStatusMonitor.ts`
10. Frontend: Edit `AwaitingApprovalScreen.tsx`
11. Build frontend → `npx tsc --noEmit`
