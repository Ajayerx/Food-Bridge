# Mobile App API Contract — Broadcast Dispatch

## Overview
When an order reaches `ReadyForPickup` (delivery type), the backend creates a **DispatchOffer** and broadcasts it to all available delivery agents via SignalR. The first agent to accept wins. This replaces the old greedy nearest-neighbor auto-assign.

## SignalR Events (Delivery Agent Mobile)

### Connection
```
Hub: /hubs/notification
Auth: Bearer token (DeliveryAgent role)
```

### Agent Registration
After connection, call:
```json
// → JoinDispatchGroup()
```
This adds the agent's connection to the `delivery_agents` group that receives all broadcast dispatch events.

### Receiving Events

#### 1. `newDispatchOffer`
Broadcast to all agents when a new offer is created.

```json
{
  "id": "guid",
  "orderId": "guid",
  "orderCode": "ORD-ABC123",
  "status": "pending",
  "expiresAt": "2026-06-25T10:00:00Z",
  "createdAt": "2026-06-25T09:59:00Z",
  "restaurantName": "Pizza Palace",
  "restaurantAddress": "123 Main St, City, State",
  "restaurantLat": 12.9716,
  "restaurantLng": 77.5946,
  "deliveryAddress": "456 Oak Ave, City, State",
  "deliveryLat": 12.9352,
  "deliveryLng": 77.6245,
  "estimatedEarnings": 45.50,
  "estimatedDistanceKm": 5.2
}
```

#### 2. `dispatchOfferAccepted`
Broadcast to all agents when an offer is accepted (so others can dismiss it).

```json
{
  "offerId": "guid",
  "orderId": "guid"
}
```

#### 3. `dispatchOfferExpired`
Broadcast when an offer expires without acceptance.

```json
{
  "offerId": "guid",
  "orderId": "guid"
}
```

## REST Endpoints (Delivery Agent Mobile)

### Base URL
```
/v1/dispatch
```

### Accept Offer
```
POST /v1/dispatch/offers/{offerId}/accept
Authorization: Bearer <token>
```
**Success (200):**
```json
{
  "success": true,
  "message": "Offer accepted — order assigned to you."
}
```
**Failure (400):**
```json
{
  "success": false,
  "error": { "message": "Offer is no longer available." }
}
```

### Reject Offer
```
POST /v1/dispatch/offers/{offerId}/reject
Authorization: Bearer <token>
```
**Success (200):**
```json
{
  "success": true,
  "message": "Offer declined."
}
```

## Agent UI Flow (Recommended)

1. Agent opens app → authenticates → connects to SignalR `/hubs/notification`
2. Agent calls `JoinDispatchGroup()` to register for broadcasts
3. Agent sets `IsAvailable = true` via `PATCH /v1/delivery/availability`
4. When a `newDispatchOffer` arrives:
   - Show a notification / screen with order details, earnings, distance, expiry countdown
   - Agent taps **Accept** → `POST /v1/dispatch/offers/{id}/accept`
   - If success → navigate to task detail screen
   - If 400 (already taken) → show "Offer taken by another agent"
5. Listen for `dispatchOfferAccepted` with the same `offerId` → dismiss the offer from other agents' screens
6. Listen for `dispatchOfferExpired` with the same `offerId` → show "Offer expired"

## Existing Delivery Agent Endpoints (also needed)

```
GET  /v1/delivery/tasks                    — My assigned tasks
GET  /v1/delivery/tasks/{id}              — Task detail
PATCH /v1/delivery/tasks/{id}/status       — Update task status
PATCH /v1/delivery/availability            — Toggle online/offline
```
