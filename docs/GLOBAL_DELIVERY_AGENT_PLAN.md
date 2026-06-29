# Global Delivery Agent — Complete Implementation Plan

## Goal
Build a complete delivery agent ecosystem: platform-global agents with self-registration → admin approval → mobile app with dispatch broadcasts.

## Architecture
- **Agents are platform-global** (no `VendorId` / `RestaurantId` on `DeliveryAgent` entity)
- **Broadcast dispatch** system already implemented (DispatchOffer → SignalR → first-accept-wins)
- **Self-registration**: Public endpoint → Status = Pending → Admin approve/reject → Active
- **Web admin panel**: Admin-only agent management with approve/reject actions
- **Mobile app**: Bare React Native CLI, maps via react-native-maps (MapLibre now, Google Maps later), Zustand stores

---

## 🔴 Phase 0 — Backend: Agent Registration + Approval Flow

### 0.1 — Update `AgentStatus` enum
| File | Change |
|---|---|
| `Domain/Enums/FoodBridgeEnums.cs` | Add `Pending` and `Rejected` to `AgentStatus`: `Pending, Active, Inactive, Banned, Rejected` |

### 0.2 — Create `AgentSelfRegistrationCommand`
| Aspect | Detail |
|---|---|
| Path | `Application/Features/Agents/Commands/AgentSelfRegistration/` |
| Files | `AgentSelfRegistrationCommand.cs`, `AgentSelfRegistrationCommandHandler.cs`, `AgentSelfRegistrationRequest.cs` |
| Handler logic | Same validation as `CreateAgentCommandHandler` but sets `Status = AgentStatus.Pending` |
| Response | `{ agentId, message: "Registration submitted for review" }` |

### 0.3 — Create `ApproveAgentCommand`
| Aspect | Detail |
|---|---|
| Path | `Application/Features/Agents/Commands/ApproveAgent/` |
| Files | `ApproveAgentCommand.cs`, `ApproveAgentCommandHandler.cs` |
| Handler logic | Fetch agent → change `Status = AgentStatus.Active` → Send push via `INotificationService` |

### 0.4 — Create `RejectAgentCommand`
| Aspect | Detail |
|---|---|
| Path | `Application/Features/Agents/Commands/RejectAgent/` |
| Files | `RejectAgentCommand.cs`, `RejectAgentCommandHandler.cs` |
| Handler logic | Fetch agent → change `Status = AgentStatus.Rejected` → optional reason |

### 0.5 — Public Registration Endpoint
```
POST /v1/auth/agent/register  [AllowAnonymous]
Body: { fullName, mobileNumber, email?, vehicleType, vehicleNumber, licenseNumber? }
→ Calls AgentSelfRegistrationCommand
```

### 0.6 — Admin Approve/Reject Endpoints
```
PATCH /v1/agents/{id}/approve  [Authorize(Roles = "Admin")]
PATCH /v1/agents/{id}/reject   [Authorize(Roles = "Admin")]
→ Calls ApproveAgentCommand / RejectAgentCommand
```

### 0.7 — EF Migration
| Name | Change |
|---|---|
| `AddAgentPendingStatus` | Updates `dbo.DeliveryAgents.Status` to handle new enum values |

### 0.8 — OTP Login for Agents
Agents already use the same `AuthController.Login` endpoint. No changes needed — agents with `Status = Active` can log in via mobile number + OTP.

---

## 🟠 Phase 1 — Web Frontend: Admin Agent Management

### 1.1 — Remove vendor agent routes
| File | Change |
|---|---|
| `FoodBridgeWebApp/src/components/layout/VendorLayout.tsx` | Remove `/vendor/agents` menu item |
| `FoodBridgeWebApp/src/router/AppRouter.tsx` | Remove `<Route path="/vendor/agents" element={...}>` |

### 1.2 — Create `AdminAgentsPage`
| File | Description |
|---|---|
| `FoodBridgeWebApp/src/features/admin/AdminAgentsPage.tsx` | Admin-only page with agent table, summary cards, Approve/Reject action buttons |

### 1.3 — Add admin routes
| File | Change |
|---|---|
| `FoodBridgeWebApp/src/router/AppRouter.tsx` | Add `<Route path="/admin/agents" element={<AdminAgentsPage />}>` |
| AdminLayout.tsx | Add "Delivery Agents" → `/admin/agents` in sidebar |

### 1.4 — Delete `VendorAgentsPage.tsx`
Clean up unused vendor page.

---

## 🟢 Phase 2 — Mobile App: Foundation (DeliveryApp/)

### 2.1 — Project Setup
```bash
npx react-native init DeliveryApp --template react-native-template-typescript
cd DeliveryApp
npm install zustand @tanstack/react-query axios @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs react-native-maps react-native-signalr react-native-vector-icons react-native-async-storage/async-storage
```

### 2.2 — Constants + Theme
| File | Contents |
|---|---|
| `src/theme/colors.ts` | `#FC8019` (primary orange), `#60B246` (success green), `#F5F5F5` (bg light), `#1A1A1A` (bg dark), etc. |
| `src/theme/typography.ts` | Font sizes, weights, line heights matching customer app (SF Pro / system fonts) |
| `src/theme/spacing.ts` | Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 |
| `src/theme/ThemeProvider.tsx` | React context with light/dark mode, provides `useTheme()` hook |
| `src/theme/createStyles.ts` | Helper: `createStyles((theme) => ({...}))` returns `StyleSheet.create` |

### 2.3 — Types
| File | Contents |
|---|---|
| `src/types/order.types.ts` | `Order`, `OrderStatus`, `OrderItem` |
| `src/types/dispatch.types.ts` | `DispatchOffer`, `DispatchOfferStatus` |
| `src/types/agent.types.ts` | `DeliveryAgent`, `AgentStatus`, `VehicleType` |
| `src/types/auth.types.ts` | `LoginRequest`, `OtpRequest`, `AuthResponse`, `RegisterRequest` |
| `src/types/navigation.types.ts` | Navigator param lists |

### 2.4 — API Client
| File | Contents |
|---|---|
| `src/api/client.ts` | Axios instance with base URL, auth token interceptor, refresh logic |
| `src/api/auth.api.ts` | `login()`, `verifyOtp()`, `register()` |
| `src/api/agent.api.ts` | `getProfile()`, `updateAvailability()` |
| `src/api/task.api.ts` | `getTasks()`, `getTaskById()`, `updateTaskStatus()` |
| `src/api/dispatch.api.ts` | `acceptOffer()`, `rejectOffer()` |

### 2.5 — Stores (Zustand)
| File | State |
|---|---|
| `src/stores/auth.store.ts` | `token`, `agent`, `isAuthenticated`, `login()`, `logout()` |
| `src/stores/agent.store.ts` | `isOnline`, `setOnline()`, `setOffline()` |
| `src/stores/theme.store.ts` | `isDarkMode`, `toggleTheme()` |
| `src/stores/dispatch.store.ts` | `currentOffer`, `setCurrentOffer()`, `clearOffer()` |

---

## 🟢 Phase 3 — Mobile App: Auth + Registration

### 3.1 — Screens
| Screen | Components Used | Notes |
|---|---|---|
| `RegistrationScreen` | `PhoneInput`, `TextInput`, `Button` | Form: name, mobile, vehicle type/color/number, license, photo |
| `AwaitingApprovalScreen` | `ActivityIndicator`, `Text` | "Your profile is under review" with animated spinner |
| `LoginScreen` | `PhoneInput`, `Button` | Phone number → request OTP |
| `OtpVerificationScreen` | `OtpInput`, `CountdownTimer`, `Button` | 6-digit OTP, auto-submit, resend after 30s |
| `AuthNavigator` | `@react-navigation/stack` | Registration → AwaitingApproval (OR) → Login → OtpVerification → MainNavigator |

### 3.2 — Auth Flow
```
[RegistrationScreen] → POST /v1/auth/agent/register
       ↓
[AwaitingApprovalScreen] (Status = Pending)
       ↓ (admin approves)
Push notification + status changes to Active
       ↓
[LoginScreen] → POST /v1/auth/login → OTP sent via SMS
       ↓
[OtpVerificationScreen] → POST /v1/auth/verify → get JWT
       ↓
[MainNavigator] (Dashboard)
```

---

## 🟢 Phase 4 — Mobile App: Dashboard + Availability

### 4.1 — Screens
| Screen | Components Used |
|---|---|
| `DashboardScreen` | `AvailabilityToggle`, `EarningsCard`, `ActiveTaskCard`, `RecentTasksList` |
| `AvailabilityToggle` | `Switch` + `PATCH /v1/delivery/availability` + location permission |
| `EarningsCard` | Today's earnings, total deliveries, average rating |
| `ActiveTaskCard` | Current assigned task summary → tap navigates to TaskDetail |
| `RecentTasksList` | FlatList of last 5 tasks with status badges |

### 4.2 — Hooks
| Hook | Logic |
|---|---|
| `useAvailability.ts` | Manages online/offline state, requests location permissions |
| `useDashboard.ts` | Fetches today's stats + active task + recent tasks |
| `useDispatchOffer.ts` | Listens for SignalR `newDispatchOffer` event |

---

## 🟢 Phase 5 — Mobile App: SignalR + Dispatch Offers

### 5.1 — SignalR Service
| File | Contents |
|---|---|
| `src/services/signalr.service.ts` | `HubConnectionBuilder` with JWT auth, reconnect logic, event listeners |
| `src/hooks/useSignalR.ts` | Connects on app start, joins `delivery_agents` SignalR group, dispatches events to Zustand stores |

### 5.2 — Offer Modal
| Component | Description |
|---|---|
| `OfferModal` | Full-screen modal triggered by `newDispatchOffer` event |
| `OfferCountdown` | Animated 60-second countdown bar, auto-expires at 0 |
| `OfferInfo` | Restaurant name/address, delivery address, distance, earnings |
| `OfferActionButtons` | Accept (green `#60B246`) + Decline (red `#E53935`) |

Offer flow:
```
SignalR: newDispatchOffer → dispatchStore.setCurrentOffer(offer)
      ↓
OfferModal slides up with countdown
      ↓
Accept → POST /v1/dispatch/offers/{id}/accept
      → PATCH /v1/delivery/availability → set offline
      → Navigate to TaskDetail
Decline → POST /v1/dispatch/offers/{id}/reject
      → stay on Dashboard (waiting for next offer)
Expire → offer removed automatically
```

---

## 🟢 Phase 6 — Mobile App: Task Management

### 6.1 — Screens
| Screen | Components Used |
|---|---|
| `TaskListScreen` | `FlatList` of `TaskCard`, filter chips |
| `TaskCard` | Order code, restaurant, address, status badge, time |
| `TaskDetailScreen` | MapLibre map with route polyline, order info, timeline, action buttons |
| `TaskStatusTimeline` | Visual timeline: Assigned → Picked Up → Delivered |

### 6.2 — Status Update Actions
| Button | API Call | Result |
|---|---|---|
| `📦 Picked Up` | `PATCH /v1/orders/{id}/status` → `Preparing` → `OutForDelivery` | Updates timeline |
| `✅ Delivered` | `PATCH /v1/orders/{id}/status` → `OutForDelivery` → `Delivered` | Task completed, agent becomes available |
| `❌ Failed` | `PATCH /v1/orders/{id}/status` → `DeliveryFailed` | Task failed, agent becomes available |

---

## 🟢 Phase 7 — Mobile App: Profile + Settings

### 7.1 — Screens
| Screen | Components Used |
|---|---|
| `ProfileScreen` | Avatar, name, vehicle info, `StatsRow`, menu items |
| `StatsRow` | Horizontal row: Total Deliveries, Earnings, Rating |
| `SettingsScreen` | `MenuItem` rows: Dark Mode toggle, Notifications toggle, Logout |

### 7.2 — Components
| Component | Description |
|---|---|
| `MenuItem` | Icon + label + right chevron/toggle, press handler |

---

## 🟢 Phase 8 — Mobile App: Navigation Wiring

### 8.1 — Navigators
| Navigator | Structure |
|---|---|
| `RootNavigator` | Checks `auth.store.isAuthenticated` → AuthNavigator or MainNavigator |
| `AuthNavigator` | Stack: Registration → AwaitingApproval → Login → OtpVerification |
| `MainNavigator` | Bottom Tabs: Dashboard | Tasks | Profile |
| `ProfileStack` | Stack: Profile → Settings |
| `OfferModal` | Presented as modal over MainNavigator via root stack |

### 8.2 — Tab Bar
| Tab | Icon | Screen |
|---|---|---|
| Dashboard | home-outline | DashboardScreen |
| Tasks | clipboard-list-outline | TaskListScreen |
| Profile | account-circle-outline | ProfileStack |

---

## File Map

```
FoodBridge/
├── DotNetBackedLatest/
│   ├── FoodBridge.Domain/Enums/FoodBridgeEnums.cs          ← 0.1
│   ├── FoodBridge.Application/
│   │   └── Features/Agents/Commands/
│   │       ├── AgentSelfRegistration/                       ← 0.2
│   │       ├── ApproveAgent/                                ← 0.3
│   │       └── RejectAgent/                                 ← 0.4
│   ├── FoodBridge.API/Controllers/
│   │   ├── AuthController.cs                                ← 0.5
│   │   └── AgentsController.cs                              ← 0.6
│   └── FoodBridge.Infrastructure/Persistence/Migrations/    ← 0.7
│
├── FoodBridgeWebApp/src/
│   ├── components/layout/VendorLayout.tsx                   ← 1.1
│   ├── router/AppRouter.tsx                                 ← 1.1+1.3
│   ├── features/admin/AdminAgentsPage.tsx                   ← 1.2
│   └── features/restaurants/VendorAgentsPage.tsx            ← 1.4 (DELETE)
│
└── DeliveryApp/                                             ← Phase 2-8
    └── src/
        ├── theme/    (colors, typography, spacing, ThemeProvider, createStyles)
        ├── types/    (order, dispatch, agent, auth, navigation)
        ├── api/      (client, auth, agent, task, dispatch)
        ├── stores/   (auth, agent, theme, dispatch)
        ├── services/ (signalr)
        ├── hooks/    (useAuth, useAvailability, useDashboard, useSignalR, useDispatchOffer)
        ├── components/ui/ (Button, TextInput, Card, Badge, Avatar, TabIcon)
        ├── components/   (OfferModal, TaskCard, EarningsCard, etc.)
        └── screens/  (Registration, AwaitingApproval, Login, OtpVerification,
                       Dashboard, TaskList, TaskDetail, Profile, Settings)
```

---

## API Contract Summary

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/v1/auth/agent/register` | Public | Self-registration with Pending status |
| `PATCH` | `/v1/agents/{id}/approve` | Admin | Approve pending agent |
| `PATCH` | `/v1/agents/{id}/reject` | Admin | Reject pending agent |
| `POST` | `/v1/auth/login` | Public | Request OTP |
| `POST` | `/v1/auth/verify` | Public | Verify OTP → JWT |
| `PATCH` | `/v1/delivery/availability` | Agent | Toggle online/offline |
| `POST` | `/v1/dispatch/offers/{id}/accept` | Agent | Accept dispatch offer |
| `POST` | `/v1/dispatch/offers/{id}/reject` | Agent | Reject dispatch offer |
| `GET` | `/v1/agents/me` | Agent | Get own profile |
| `GET` | `/v1/agents` | Admin | List all agents (with status filter) |
| `GET` | `/v1/orders?assignedTo={agentId}` | Agent | Get assigned tasks |

## SignalR Events (Hub: `/hubs/notifications`)

| Event | Direction | Payload | When |
|---|---|---|---|
| `newDispatchOffer` | Server → Group `delivery_agents` | `DispatchOfferDto` | Order status → OutForDelivery |
| `dispatchOfferAccepted` | Server → All agents | `{ offerId, agentId }` | Another agent accepted |
| `dispatchOfferExpired` | Server → All agents | `{ offerId }` | 60s timeout |
| `taskUpdate` | Server → Agent | `TaskStatusUpdateDto` | Status changes on assigned task |

---

## Mobile Screen Component Hierarchy

```
<RootNavigator>
  ├── <AuthNavigator>                      (not authenticated)
  │   ├── RegistrationScreen
  │   ├── AwaitingApprovalScreen
  │   ├── LoginScreen
  │   └── OtpVerificationScreen
  │
  └── <MainNavigator>                      (authenticated)
      ├── <DashboardTab>
      │   └── DashboardScreen
      │       ├── AvailabilityToggle
      │       ├── EarningsCard
      │       ├── ActiveTaskCard
      │       └── RecentTasksList
      │
      ├── <TasksTab>
      │   ├── TaskListScreen
      │   │   ├── FilterChips
      │   │   └── TaskCard[]
      │   └── TaskDetailScreen
      │       ├── MapView
      │       ├── OrderInfo
      │       ├── TaskStatusTimeline
      │       └── ActionButtons
      │
      └── <ProfileTab>
          ├── ProfileScreen
          │   ├── Avatar
          │   ├── AgentInfo
          │   └── StatsRow
          └── SettingsScreen
              ├── DarkModeToggle
              ├── NotificationToggle
              └── LogoutButton
```

---

## Guidelines
- Follow existing CQRS/MediatR/Clean Architecture patterns in the backend
- Web frontend: match existing component patterns (MUI, React Query, etc.)
- Mobile app: match customer app's orange brand (#FC8019), typography, and dark mode patterns
- Use Zustand for state management (same as customer app)
- Use React Query for server state
- Use react-native-maps with MapLibre initially, support swap to Google Maps later
- Keep screens thin — logic goes in hooks and stores
- Do not add comments unless necessary for clarity
