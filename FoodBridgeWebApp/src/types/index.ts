// ─────────────────────────────────────────────────────────────────────────────
// FoodBridge — shared TypeScript types (all 16 DB domains)
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth / Users ──────────────────────────────────────────────────────────────
export type RoleType = "Customer" | "Vendor" | "Admin" | "Staff" | "DeliveryAgent";
export type StaffRole = "manager" | "waiter" | "kitchen" | "cashier";

// Backend serialises C# enum as Pascal-case strings
export type UserStatus = "Active" | "Inactive" | "Banned";

export interface User {
    id: string;
    name: string | null;
    mobileNumber: string;
    email?: string | null;
    roleType: RoleType;
    staffRole?: StaffRole | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

// ── API TYPES (snake_case — exact backend contract) ───────────────────────────
export interface ApiUser {
    id: string;
    full_name: string | null;
    mobile_number: string;
    email?: string | null;
    role: RoleType;
    status: UserStatus;
    avatar_url?: string | null;
    last_login_at?: string | null;
    created_at: string;
}

export interface ApiLoginResponse {
    user: ApiUser;
    access_token: string;
    refresh_token: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardChartPoint {
    label: string;
    value: number;
    count: number;
}

export interface TopRestaurant {
    id: string;
    name: string;
    logoUrl: string | null;
    totalOrders: number;
    totalRevenue: number;
    avgRating: number;
}

export interface DashboardStats {
    // Orders
    totalOrders: number;
    todayOrders: number;
    pendingOrders: number;
    activeOrders: number;
    cancelledOrders: number;
    // Revenue
    totalRevenue: number;
    todayRevenue: number;
    monthRevenue: number;
    platformCommission: number;
    // Users
    totalUsers: number;
    totalCustomers: number;
    totalVendors: number;
    totalAgents: number;
    newUsersToday: number;
    newUsersThisMonth: number;
    // Restaurants
    totalRestaurants: number;
    activeRestaurants: number;
    pendingRestaurants: number;
    // Delivery
    totalDeliveries: number;
    activeAgents: number;
    availableAgents: number;
    // Reviews
    totalReviews: number;
    avgPlatformRating: number;
    // Charts
    ordersChart: DashboardChartPoint[];
    revenueChart: DashboardChartPoint[];
    topRestaurants: TopRestaurant[];
}

// ── Restaurants ───────────────────────────────────────────────────────────────
export type RestaurantStatus = "pending" | "approved" | "suspended" | "rejected";

export interface Restaurant {
    id: string;
    ownerId: string;
    name: string;
    description?: string | null;
    address: string;
    city: string;
    latitude?: number | null;
    longitude?: number | null;
    phone: string;
    email?: string | null;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    isOpen: boolean;
    isActive: boolean;
    status: RestaurantStatus;
    rejectionReason?: string | null;
    avgRating?: number;
    totalRatings?: number;
    createdAt: string;
    updatedAt: string;
}

// ── Menu ──────────────────────────────────────────────────────────────────────
export interface MenuCategory {
    id: string;
    restaurantId: string;
    name: string;
    imageUrl?: string | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string | null;
    deletedAt?: string | null;
    items?: MenuItem[];
}

export interface MenuItem {
    id: string;
    categoryId: string;
    restaurantId: string;
    name: string;
    description?: string | null;
    price: number;
    imageUrl?: string | null;
    isVeg: boolean;
    dietaryTag: string;
    isAvailable: boolean;
    isFeatured: boolean;
    prepTimeMinutes?: number | null;
    sortOrder: number;
    variants: ItemVariant[];
}

export interface ItemVariant {
    id: string;
    itemId: string;
    name: string;
    price: number;
    isAvailable: boolean;
}

// ── Orders ────────────────────────────────────────────────────────────────────
export type OrderStatus =
    | "placed"
    | "accepted"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "completed"
    | "cancelled";

export type OrderType = "delivery" | "takeaway" | "dinein";
export type PaymentMethod = "online" | "cod";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";

export interface OrderItem {
    customerName?: string | null;
    id: string;
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    variantName?: string | null;
    notes?: string | null;
}
// ── Cart (UI state — pre-order) ───────────────────────────────────────────────
export interface CartItem {
    menuItemId: string;
    variantId?: string;
    name: string;
    variantName?: string;
    unitPrice: number;
    quantity: number;
}
export interface Order {
    id: string;
    orderCode?: string | null;
    restaurantId: string;
    customerId: string | null;
    agentId?: string | null;
    orderType?: OrderType | null;
    status: OrderStatus;
    subtotalAmount?: number;
    taxAmount?: number;
    totalAmount: number;
    deliveryFee: number;
    discountAmount: number;
    platformFee?: number;
    couponCode?: string | null;
    tableName: string | null;
    tableCapacity: number | null;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    deliveryAddress: string | null;
    specialInstructions?: string | null;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
    acceptedAt?: string | null;
    readyAt?: string | null;
    completedAt?: string | null;
    cancelledAt?: string | null;
}

// ── Menu Modifiers ─────────────────────────────────────────────────────────────
export interface ModifierGroup {
    id: string;
    name: string;
    isRequired: boolean;
    maxSelections: number;
    options: ModifierOption[];
}

export interface ModifierOption {
    id: string;
    name: string;
    additionalPrice: number;
    isAvailable: boolean;
}

export interface CreateModifierGroupRequest {
    name: string;
    isRequired?: boolean;
    maxSelections?: number;
}

export interface CreateModifierOptionRequest {
    name: string;
    additionalPrice?: number;
}

// ── Coupons ───────────────────────────────────────────────────────────────────
export type DiscountType = "percentage" | "flat";

export interface Coupon {
    id: string;
    restaurantId?: string | null;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    minOrderAmount?: number | null;
    maxDiscountAmount?: number | null;
    usageLimit?: number | null;
    usedCount: number;
    isActive: boolean;
    startDate?: string | null;
    endDate?: string | null;
    createdAt: string;
}

// ── Delivery Agents ───────────────────────────────────────────────────────────
export type AgentStatus = "pending" | "approved" | "suspended";
export type AgentAvailability = "online" | "offline" | "busy";

export interface DeliveryAgent {
    id: string;
    userId: string;
    restaurantId: string;
    vehicleType?: string | null;
    vehicleNumber?: string | null;
    status: AgentStatus;
    isAvailable: AgentAvailability;
    totalDeliveries: number;
    avgRating?: number | null;
    createdAt: string;
}

// ── Staff ─────────────────────────────────────────────────────────────────────
export interface StaffMember {
    id: string;
    userId: string;
    restaurantId: string;
    role: StaffRole;
    isActive: boolean;
    createdAt: string;
    user?: Pick<User, "id" | "name" | "mobileNumber">;
}

// ── Tables ────────────────────────────────────────────────────────────────────
export type TableStatus = "available" | "occupied" | "reserved";

export interface Table {
    id: string;
    restaurantId: string;
    tableNumber: string;
    capacity: number;
    status: TableStatus;
    qrCode?: string | null;
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export interface Review {
    id: string;
    orderId: string;
    restaurantId: string;
    customerId: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export type NotificationChannel = "push" | "sms" | "in_app";
export type NotificationType = "order_update" | "promotion" | "system" | "support";

export interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    channel: NotificationChannel;
    isRead: boolean;
    data?: Record<string, unknown> | null;
    createdAt: string;
}

// ── Support Tickets ───────────────────────────────────────────────────────────
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory = "order_issue" | "payment_issue" | "delivery_issue" | "other";

export interface TicketMessage {
    id: string;
    ticketId: string;
    senderId: string;
    senderRole: RoleType;
    message: string;
    createdAt: string;
}

export interface SupportTicket {
    id: string;
    userId: string;
    orderId?: string | null;
    subject: string;
    status: TicketStatus;
    category: TicketCategory;
    assignedTo?: string | null;
    messages?: TicketMessage[];
    createdAt: string;
    updatedAt: string;
}

// ── Reports / Analytics ───────────────────────────────────────────────────────
export interface RevenueDataPoint {
    date: string;
    revenue: number;
    orders: number;
}

export interface TopItem {
    menuItemId: string;
    name: string;
    totalOrders: number;
    revenue: number;
}

export interface VendorReport {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    revenueByDay: RevenueDataPoint[];
    topItems: TopItem[];
}

export interface PlatformReport {
    totalRevenue: number;
    totalOrders: number;
    totalRestaurants: number;
    totalUsers: number;
    newUsersToday: number;
    revenueByDay: RevenueDataPoint[];
    revenueByRestaurant: Array<{ restaurantId: string; name: string; revenue: number }>;
    payoutSummary: Array<{
        restaurantId: string;
        name: string;
        grossRevenue: number;
        platformFee: number;
        netPayout: number;
    }>;
}

// ── Platform Settings ─────────────────────────────────────────────────────────
export interface PlatformSettings {
    deliveryFeeBase: number;
    deliveryFeePerKm: number;
    platformFeePercent: number;
    maxDeliveryRadiusKm: number;
    supportEmail: string;
    supportPhone: string;
    maintenanceMode: boolean;
}

// ── Banners (Admin) ────────────────────────────────────────────────────────────
export interface Banner {
    id: string;
    title: string;
    subTitle?: string | null;
    imageUrl: string;
    linkUrl?: string | null;
    linkType?: string | null;
    isActive: boolean;
    displayOrder: number;
    startsAt?: string | null;
    endsAt?: string | null;
    createdAt: string;
}

export interface CreateBannerRequest {
    title: string;
    subTitle?: string | null;
    imageUrl: string;
    linkUrl?: string | null;
    linkType?: string | null;
    isActive?: boolean;
    displayOrder?: number;
    startsAt?: string | null;
    endsAt?: string | null;
}

export interface UpdateBannerRequest {
    title?: string;
    subTitle?: string | null;
    imageUrl?: string;
    linkUrl?: string | null;
    linkType?: string | null;
    isActive?: boolean;
    displayOrder?: number;
    startsAt?: string | null;
    endsAt?: string | null;
}

// ── Commissions (Admin) ────────────────────────────────────────────────────────
export interface Commission {
    id: string;
    orderId: string;
    restaurantId: string;
    restaurantName: string;
    amount: number;
    rate: number;
    type: string;
    notes?: string | null;
    vendorPayoutId?: string | null;
    createdAt: string;
}

export interface UpdateCommissionRequest {
    rate: number;
    type: string;
    notes?: string | null;
}

// ── Payouts (Admin) ────────────────────────────────────────────────────────────
export interface Payout {
    id: string;
    vendorId: string;
    vendorName: string;
    amount: number;
    currency: string;
    status: string;
    transactionId?: string | null;
    bankAccountNumber?: string | null;
    bankIfscCode?: string | null;
    notes?: string | null;
    periodFrom: string;
    periodTo: string;
    processedAt?: string | null;
    createdAt: string;
}

// ── Payments ──────────────────────────────────────────────────────────────────
export interface Payment {
    id: string;
    orderId: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    gatewayOrderId?: string | null;
    gatewayPaymentId?: string | null;
    createdAt: string;
}

// ── Pagination helper ─────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ── Generic API response wrapper ──────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data: T;
}