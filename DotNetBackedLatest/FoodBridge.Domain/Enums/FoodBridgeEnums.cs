namespace FoodBridge.Domain.Enums;

// ─────────────────────────────────────────────
// User & Identity
// ─────────────────────────────────────────────
public enum UserRole
{
    Customer,
    Vendor,
    Admin,
    Staff,
    DeliveryAgent
}

public enum UserStatus
{
    Active,
    Inactive,
    Banned
}

public enum AdminLevel
{
    Super,
    Manager,
    Support
}

// ── NEW ──────────────────────────────────────
public enum UserRoleType
{
    Customer,
    Vendor,
    Admin,
    Staff,
    DeliveryAgent,
    SuperAdmin
}

// ─────────────────────────────────────────────
// Vendor & Restaurant
// ─────────────────────────────────────────────
public enum VendorStatus
{
    Pending,
    Approved,
    Rejected,
    Suspended
}

public enum RestaurantStatus
{
    Pending,
    Active,
    Inactive,
    Suspended,
    Rejected
}

// ── NEW ──────────────────────────────────────
public enum TableStatus
{
    Available,
    Occupied,
    Reserved,
    OutOfService
}

// ─────────────────────────────────────────────
// Menu
// ─────────────────────────────────────────────
public enum DietaryTag
{
    Veg,
    NonVeg,
    Vegan,
    Egg
}

// ─────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────
public enum OrderStatus
{
    Placed,
    Confirmed,
    Preparing,
    ReadyForPickup,
    OutForDelivery,
    Delivered,
    Completed,
    Cancelled,
    Refunded
}

public enum OrderType
{
    Delivery,
    Takeaway,
    DineIn
}

public enum OrderPaymentStatus
{
    Pending,
    Paid,
    Failed,
    Refunded
}

// ── NEW ──────────────────────────────────────
public enum OrderPaymentMethod
{
    Online,
    COD,
    Wallet,
    UPI,
    Card,
    NetBanking
}

// ─────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────
public enum PaymentMethod
{
    Pending,
    Online,
    COD
}

public enum PaymentStatus
{
    Pending,
    Captured,
    Failed,
    Refunded
}

// ── NEW ──────────────────────────────────────
public enum PaymentRecordStatus
{
    Initiated,
    Pending,
    Authorized,
    Captured,
    Failed,
    Refunded,
    PartiallyRefunded,
    Cancelled
}

public enum RefundStatus
{
    Pending,
    Processed,
    Failed,
    Initiated
}

// ─────────────────────────────────────────────
// Delivery
// ─────────────────────────────────────────────
public enum DeliveryTaskStatus
{
    Assigned,
    PickedUp,
    Delivered,
    Failed
}

public enum AgentStatus
{
    Active,
    Inactive,
    Banned
}

// ── NEW ──────────────────────────────────────
public enum VehicleType
{
    Bicycle,
    Motorcycle,
    Scooter,
    Car,
    Van,
    OnFoot
}

// ─────────────────────────────────────────────
// Coupons
// ─────────────────────────────────────────────
public enum CouponStatus
{
    Active,
    Inactive,
    Expired
}

public enum CouponType
{
    Percentage,
    Flat
}

// ── NEW ──────────────────────────────────────
public enum CouponScope
{
    Platform,       // valid on all restaurants
    Restaurant,     // valid on specific restaurant only
    Category,       // valid on specific menu category
    MenuItem        // valid on specific menu item
}

public enum DiscountType
{
    Percentage,
    FlatAmount,
    FreeDelivery,
    BuyOneGetOne
}

// ─────────────────────────────────────────────
// Staff
// ─────────────────────────────────────────────
public enum StaffRole
{
    Manager,
    Kitchen,
    Cashier,
    Waiter
}

// ─────────────────────────────────────────────
// Address
// ─────────────────────────────────────────────
// ── NEW ──────────────────────────────────────
public enum AddressLabel
{
    Home,
    Work,
    Hotel,
    Other
}

// ─────────────────────────────────────────────
// Support
// ─────────────────────────────────────────────
public enum TicketStatus
{
    Open,
    InProgress,
    Resolved,
    Closed
}

public enum TicketSenderType
{
    Customer,
    Support
}

// ── NEW ──────────────────────────────────────
public enum SupportCategory
{
    OrderIssue,
    PaymentIssue,
    DeliveryIssue,
    RefundRequest,
    AccountIssue,
    RestaurantComplaint,
    AppBug,
    Other
}

public enum MessageType
{
    Text,
    Image,
    Document,
    System
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────
public enum NotificationType
{
    // ── keep your existing ones ──
    System,
    Promotion,
    Support,

    // ── add all order-related types ──
    OrderConfirmed,
    OrderPreparing,
    OrderReady,
    OutForDelivery,
    OrderDelivered,
    OrderCancelled,
    OrderCancelledByVendor,
    RefundInitiated,
    RefundCompleted,
    PaymentReceived,
    ReviewRequest,
    NewOrder,      // vendor-side
    NewReview,     // vendor-side

    // ── rename old one to avoid breaking existing code ──
    OrderUpdate,   // keep for backwards compat
}

public enum DevicePlatform
{
    Android,
    iOS,
    Web
}

// ─────────────────────────────────────────────
// Commission & Payouts
// ─────────────────────────────────────────────
public enum CommissionType
{
    Percentage,
    Flat
}

public enum PayoutStatus
{
    Pending,
    Processing,
    Completed,
    Failed
}

// ─────────────────────────────────────────────
// Platform Settings
// ─────────────────────────────────────────────
public enum SettingDataType
{
    String,
    Number,
    Boolean,
    Json
}

// ─────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────
public enum StorageProvider
{
    Local,
    AzureBlob,
    S3,
    Cloudinary
}

// ─────────────────────────────────────────────
// Audit
// ─────────────────────────────────────────────
public enum AuditAction
{
    Create,
    Update,
    Delete,
    Login,
    Logout
}