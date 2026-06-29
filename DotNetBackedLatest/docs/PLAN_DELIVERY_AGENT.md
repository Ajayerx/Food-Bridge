# Delivery Agent Dispatch System — Plan

## Architecture: Broadcast → First-Accept-Wins

Instead of assigning the nearest agent directly (greedy), the system broadcasts an offer to all available agents within range. The first agent to accept gets the assignment.

## New Entity: DispatchOffer

```
DispatchOffer {
    Id (Guid, PK)
    OrderId (Guid, FK → Orders)
    AgentId (Guid, FK → DeliveryAgents)
    Status (DispatchOfferStatus: Pending, Accepted, Rejected, Expired)
    OfferedAt (DateTime)
    ExpiresAt (DateTime)
    RespondedAt (DateTime?)
}
```

## Flow

```
Order reaches ReadyForPickup (for Delivery orders)
    |
    v
Find available, active agents within MAX_DISPATCH_RADIUS (8 km)
    |
    v
For each agent, create DispatchOffer (status=Pending, expires=now+30s)
    |
    v
Broadcast via SignalR to agent group "dispatch_offers"
  Payload: { offerId, orderId, restaurantName, pickupAddress, deliveryAddress, items, expiresAt }
    |
    v
Agents receive notification on mobile app
    |
    v
Agent calls POST /v1/delivery/offers/{offerId}/accept
    |
    v
Backend: Redis lock → set status=Accepted (others → Expired)
Create DeliveryTask → Set Order.DeliveryAgentId → Set Agent.IsAvailable=false
Broadcast "offer_expired" to all other agents
Broadcast "agent_assigned" to vendor + customer
    |
    v
If all agents reject or timeout (30s):
  1st retry: Expand radius to 12 km, re-broadcast
  2nd retry: Expand to 20 km
  3rd failure: Notify vendor for manual assignment
```

## New Files

```
FoodBridge.Domain/Entities/DispatchOffer.cs
FoodBridge.Domain/Enums/DispatchOfferStatus.cs (or in FoodBridgeEnums.cs)
FoodBridge.Infrastructure/Persistence/Configurations/DispatchOfferConfiguration.cs
FoodBridge.Application/Features/Delivery/Commands/CreateDispatchOffers/CreateDispatchOffersCommand.cs
FoodBridge.Application/Features/Delivery/Commands/CreateDispatchOffers/CreateDispatchOffersCommandHandler.cs
FoodBridge.Application/Features/Delivery/Commands/AcceptDispatchOffer/AcceptDispatchOfferCommand.cs
FoodBridge.Application/Features/Delivery/Commands/AcceptDispatchOffer/AcceptDispatchOfferCommandHandler.cs
FoodBridge.Application/Features/Delivery/Commands/RejectDispatchOffer/RejectDispatchOfferCommand.cs
FoodBridge.Application/Features/Delivery/Commands/RejectDispatchOffer/RejectDispatchOfferCommandHandler.cs
FoodBridge.Application/Features/Delivery/Commands/ExpireDispatchOffers/ExpireDispatchOffersCommand.cs
FoodBridge.Application/Features/Delivery/Commands/ExpireDispatchOffers/ExpireDispatchOffersCommandHandler.cs
FoodBridge.Infrastructure/Services/DispatchService.cs
```

## Modified Files

```
IAppDbContext.cs           — Add DbSet<DispatchOffer>
AppDbContext.cs             — Add DbSet<DispatchOffer>
FoodBridgeEnums.cs          — Add DispatchOfferStatus enum
OrdersController.cs         — Keep manual assign endpoint
DeliveryController.cs       — ADD: accept/reject offer endpoints
UpdateOrderStatusCommandHandler.cs — Replace auto-assign with CreateDispatchOffers
OrderHub.cs                 — ADD: NotifyDispatchOffer, NotifyOfferExpired
OrderNotificationService.cs — ADD: Dispatch offer notification methods
```

## Mobile API Contract

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/delivery/offers/{offerId}/accept` | DeliveryAgent | Accept a dispatch offer |
| POST | `/v1/delivery/offers/{offerId}/reject` | DeliveryAgent | Reject a dispatch offer |
| GET | `/v1/delivery/offers/pending` | DeliveryAgent | Get pending offers |
| PATCH | `/v1/delivery/availability` | DeliveryAgent | Toggle on/off + GPS |
| PATCH | `/v1/delivery/tasks/{id}/status` | DeliveryAgent | Update delivery task status |
| GET | `/v1/delivery/tasks` | DeliveryAgent | List my tasks |

## SignalR Events (Hub → Agent Mobile)

| Event | Description |
|-------|-------------|
| `dispatch_offer` | New offer available for acceptance |
| `offer_accepted` | Your offer was accepted (confirmation) |
| `offer_expired` | Offer expired (timeout or another agent accepted) |
| `agent_assigned` | Confirmation from vendor side (order assigned) |

## Implementation Order

1. DispatchOffer entity + migration
2. IAppDbContext + AppDbContext updates
3. CreateDispatchOffers command/handler
4. AcceptDispatchOffer command/handler
5. RejectDispatchOffer command/handler
6. ExpireDispatchOffers command/handler + background service
7. DispatchService (broadcast + retry)
8. Wire into UpdateOrderStatusCommandHandler
9. DeliveryController endpoints
10. SignalR events
11. Mobile API contract document
