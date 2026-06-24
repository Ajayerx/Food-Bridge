using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace FoodBridge.Application.Common.Interfaces;

public interface IAppDbContext
{
    // ── Identity ──────────────────────────────────────────
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    // ── Profiles ──────────────────────────────────────────
    DbSet<Customer> Customers { get; }
    DbSet<CustomerAddress> CustomerAddresses { get; }
    DbSet<Vendor> Vendors { get; }
    DbSet<Admin> Admins { get; }
    DbSet<StaffUser> StaffUsers { get; }
    DbSet<DeliveryAgent> DeliveryAgents { get; }

    // ── Restaurant ────────────────────────────────────────
    DbSet<Restaurant> Restaurants { get; }
    DbSet<RestaurantTable> RestaurantTables { get; }

    // ── Menu ──────────────────────────────────────────────
    DbSet<MenuCategory> MenuCategories { get; }
    DbSet<MenuItem> MenuItems { get; }
    DbSet<ItemVariant> ItemVariants { get; }
    DbSet<ModifierGroup> ModifierGroups { get; }
    DbSet<ModifierOption> ModifierOptions { get; }

    // ── Orders ────────────────────────────────────────────
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<OrderItemModifier> OrderItemModifiers { get; }

    // ── Coupons ───────────────────────────────────────────
    DbSet<Coupon> Coupons { get; }
    DbSet<CouponRedemption> CouponRedemptions { get; }

    // ── Delivery ──────────────────────────────────────────
    DbSet<DeliveryTask> DeliveryTasks { get; }

    // ── Payments ──────────────────────────────────────────
    DbSet<Payment> Payments { get; }
    DbSet<Refund> Refunds { get; }
    DbSet<Commission> Commissions { get; }
    DbSet<VendorPayout> VendorPayouts { get; }

    // ── Reviews ───────────────────────────────────────────
    DbSet<Review> Reviews { get; }

    // ── Support ───────────────────────────────────────────
    DbSet<SupportTicket> SupportTickets { get; }
    DbSet<TicketMessage> TicketMessages { get; }

    // ── Notifications ─────────────────────────────────────
    DbSet<Notification> Notifications { get; }
    DbSet<DeviceToken> DeviceTokens { get; }

    // ── Platform ──────────────────────────────────────────
    DbSet<PlatformSetting> PlatformSettings { get; }
    DbSet<AuditLog> AuditLogs { get; }

    // ── Banners ───────────────────────────────────────────
    DbSet<Banner> Banners { get; }

    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
