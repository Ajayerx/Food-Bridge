# Order System Enhancements — Non-Delivery-Agent Improvements

## 🔴 HIGH PRIORITY

### 1. State Machine Validation — UpdateOrderStatusCommandHandler
- **File:** `FoodBridge.Application\Features\Orders\Commands\UpdateOrderStatus\UpdateOrderStatusCommandHandler.cs`
- Add `Dictionary<OrderStatus, OrderStatus[]>` of valid transitions:
  - `Placed → [Confirmed, Cancelled]`
  - `Confirmed → [Preparing, Cancelled]`
  - `Preparing → [ReadyForPickup, Cancelled]`
  - `ReadyForPickup → [OutForDelivery, Completed]`
  - `OutForDelivery → [Delivered]`
  - `Delivered → [Completed]`
  - `Completed → []` (terminal)
  - `Cancelled → [Refunded]`
- Reject invalid jumps with `BadRequestException`

### 2. OrderStatusHistory Entity
- **New Entity:** `OrderStatusHistory { Id, OrderId, FromStatus, ToStatus, ChangedByUserId, ChangedByRole, Reason, ChangedAt }`
- **Files:** New entity, EF config, DbSet in AppDbContext/IAppDbContext
- **Log in:** CreateOrderCommandHandler, UpdateOrderStatusCommandHandler, CancelOrderCommandHandler, SettleBillCommandHandler
- **Migration:** `dotnet ef migrations add AddOrderStatusHistory`

### 3. Customer-Facing Tracking Page (Separate Android App — Not in Scope)

### 4. SignalR Frontend Fixes (Delivery-Agent Related — Out of Scope)

### 5. Fix Delivered → Completed Frontend Mapping
- **Files:** `FoodBridgeWebApp/src/types/index.ts`, `order.service.ts`, `VendorOrdersBoard.tsx`
- Add `"delivered"` to frontend `OrderStatus` type
- Update `BE_TO_FE` in `order.service.ts` to map `delivered` -> `delivered` (not `completed`)
- Add delivered to `STATUS_COLUMNS`
- Keep `completed` as separate final state after delivered

### 6. Implement Refunded Workflow
- Allow `Cancelled → Refunded` in state machine
- Add `RefundedAt` timestamp to entity
- Update frontend type to include `"refunded"`

## 🟡 MEDIUM PRIORITY

### 7. Cancellation Timeout — Background Job
- Query orders with `Status = Placed && CreatedAt < (now - 5min)`
- Auto-cancel with reason "Auto-cancelled — no confirmation"
- Send notification to customer
- Implement as `IHostedService` or background timer

### 8. Order Modification (Dine-In Only — Already Works)

### 9. Delivery ETA (Agent Related — Out of Scope)

### 10. Missing Timestamps on OrderDto & Entity
- Add to `Order` entity: `AcceptedAt`, `PreparedAt`, `ReadyAt`, `CancelledAt`, `RefundedAt`
- Set in domain methods and status handlers
- Add to `OrderDto`
- Map in all 4 query handlers (GetOrders, GetById, GetHistory)

### 11. Pagination (Frontend — Out of Scope)

### 12. Fix SettleBill Authorization
- Uncomment `[Authorize(Roles = "Vendor,Staff,Admin")]` on `SettleBill` endpoint

### 13. Cancel Reason Modal (Frontend Vendor Board)
- Replace hardcoded `"Cancelled by vendor"` with a modal prompt for reason

### 14. Complete SignalR Notification Coverage
- Add `ready_for_pickup` notification
- Add `completed` notification
- Update `NotificationType` enum usage

## 🟢 LOW PRIORITY

### 15–20: Future Enhancements
- Reorder from history, scheduled orders, DTO refactor, report exports, push notifications
