using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    // ── Identity ──────────────────────────────────────────
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // ── Profiles ──────────────────────────────────────────
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<StaffUser> StaffUsers => Set<StaffUser>();
    public DbSet<DeliveryAgent> DeliveryAgents => Set<DeliveryAgent>();

    // ── Restaurant ────────────────────────────────────────
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<RestaurantTable> RestaurantTables => Set<RestaurantTable>();

    // ── Menu ──────────────────────────────────────────────
    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<ItemVariant> ItemVariants => Set<ItemVariant>();
    public DbSet<ModifierGroup> ModifierGroups => Set<ModifierGroup>();
    public DbSet<ModifierOption> ModifierOptions => Set<ModifierOption>();

    // ── Orders ────────────────────────────────────────────
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderItemModifier> OrderItemModifiers => Set<OrderItemModifier>();

    // ── Coupons ───────────────────────────────────────────
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<CouponRedemption> CouponRedemptions => Set<CouponRedemption>();

    // ── Delivery ──────────────────────────────────────────
    public DbSet<DeliveryTask> DeliveryTasks => Set<DeliveryTask>();

    // ── Payments ──────────────────────────────────────────
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Refund> Refunds => Set<Refund>();
    public DbSet<Commission> Commissions => Set<Commission>();
    public DbSet<VendorPayout> VendorPayouts => Set<VendorPayout>();

    // ── Reviews ───────────────────────────────────────────
    public DbSet<Review> Reviews => Set<Review>();

    // ── Support ───────────────────────────────────────────
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();
    public DbSet<TicketMessage> TicketMessages => Set<TicketMessage>();

    // ── Notifications ─────────────────────────────────────
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<DeviceToken> DeviceTokens => Set<DeviceToken>();

    // ── Platform ──────────────────────────────────────────
    public DbSet<PlatformSetting> PlatformSettings => Set<PlatformSetting>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    // ── Banners ───────────────────────────────────────────
    public DbSet<Banner> Banners => Set<Banner>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Auto-apply all IEntityTypeConfiguration classes in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly);

        // ════════════════════════════════════════════════════════
        // GLOBAL QUERY FILTERS — Soft Delete
        // ════════════════════════════════════════════════════════

        // ── Root entities ────────────────────────────────────────
        modelBuilder.Entity<User>()
            .HasQueryFilter(u => u.DeletedAt == null);
        modelBuilder.Entity<Restaurant>()
            .HasQueryFilter(r => r.DeletedAt == null);
        modelBuilder.Entity<MenuCategory>()
            .HasQueryFilter(c => c.DeletedAt == null);
        modelBuilder.Entity<MenuItem>()
            .HasQueryFilter(i => i.DeletedAt == null);

        // ── User dependents ──────────────────────────────────────
        modelBuilder.Entity<Admin>()
            .HasQueryFilter(a => a.User.DeletedAt == null);
        modelBuilder.Entity<Customer>()
            .HasQueryFilter(c => c.User.DeletedAt == null);
        modelBuilder.Entity<Vendor>()
            .HasQueryFilter(v => v.User.DeletedAt == null);
        modelBuilder.Entity<DeliveryAgent>()
            .HasQueryFilter(d => d.User.DeletedAt == null);
        modelBuilder.Entity<StaffUser>()
            .HasQueryFilter(s => s.User.DeletedAt == null);
        modelBuilder.Entity<RefreshToken>()
            .HasQueryFilter(r => r.User.DeletedAt == null);
        modelBuilder.Entity<Notification>()
            .HasQueryFilter(n => n.User.DeletedAt == null);
        modelBuilder.Entity<DeviceToken>()
            .HasQueryFilter(d => d.User.DeletedAt == null);
        modelBuilder.Entity<SupportTicket>()
            .HasQueryFilter(t => t.User.DeletedAt == null);
        modelBuilder.Entity<TicketMessage>()
            .HasQueryFilter(m => m.Sender.DeletedAt == null);
        modelBuilder.Entity<AuditLog>()
            .HasQueryFilter(a => a.User.DeletedAt == null);

        // ── Customer dependents ──────────────────────────────────
        modelBuilder.Entity<CustomerAddress>()
            .HasQueryFilter(a => a.Customer.User.DeletedAt == null);
        modelBuilder.Entity<CouponRedemption>()
            .HasQueryFilter(cr => cr.Customer.User.DeletedAt == null);

        // ── Vendor dependents ────────────────────────────────────
        modelBuilder.Entity<VendorPayout>()
            .HasQueryFilter(vp => vp.Vendor.User.DeletedAt == null);

        // ── Restaurant dependents ────────────────────────────────
        modelBuilder.Entity<Order>()
            .HasQueryFilter(o => o.Restaurant.DeletedAt == null);
        modelBuilder.Entity<RestaurantTable>()
            .HasQueryFilter(t => t.Restaurant.DeletedAt == null);
        modelBuilder.Entity<Review>()
            .HasQueryFilter(r => r.Restaurant.DeletedAt == null);
        modelBuilder.Entity<Commission>()
            .HasQueryFilter(c => c.Restaurant.DeletedAt == null);
        modelBuilder.Entity<ModifierGroup>()
            .HasQueryFilter(g => g.Restaurant.DeletedAt == null);

        // ── DeliveryAgent dependents ─────────────────────────────
        modelBuilder.Entity<DeliveryTask>()
            .HasQueryFilter(dt => dt.Agent.User.DeletedAt == null);

        // ── MenuItem dependents ──────────────────────────────────
        modelBuilder.Entity<ItemVariant>()
            .HasQueryFilter(v => v.MenuItem.DeletedAt == null);
        modelBuilder.Entity<OrderItem>()
            .HasQueryFilter(i => i.MenuItem.DeletedAt == null);

        // ── ModifierGroup dependents ─────────────────────────────
        modelBuilder.Entity<ModifierOption>()
            .HasQueryFilter(mo => mo.ModifierGroup.Restaurant.DeletedAt == null);

        // ── Order dependents ─────────────────────────────────────
        modelBuilder.Entity<Payment>()
            .HasQueryFilter(p => p.Order.Restaurant.DeletedAt == null);

        // ── OrderItem dependents ─────────────────────────────────
        modelBuilder.Entity<OrderItemModifier>()
            .HasQueryFilter(oim => oim.OrderItem.MenuItem.DeletedAt == null);

        // ── Payment dependents ───────────────────────────────────
        modelBuilder.Entity<Refund>()
            .HasQueryFilter(r => r.Payment.Order.Restaurant.DeletedAt == null);

        // ── Banners ───────────────────────────────────────────────
        modelBuilder.Entity<Banner>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).HasMaxLength(200).IsRequired();
            b.Property(x => x.ImageUrl).HasMaxLength(500).IsRequired();
            b.Property(x => x.LinkUrl).HasMaxLength(500);
            b.Property(x => x.LinkType).HasMaxLength(50);
            b.Property(x => x.SubTitle).HasMaxLength(300);
        });


        foreach (var relationship in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            if (relationship.DeleteBehavior == DeleteBehavior.Cascade)
                relationship.DeleteBehavior = DeleteBehavior.NoAction;
        }
        // ── Default Schema ───────────────────────────────────
        modelBuilder.HasDefaultSchema("dbo");
    }

    protected override void OnConfiguring(
        DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured) return;

        optionsBuilder
            .EnableSensitiveDataLogging(false)
            .EnableDetailedErrors(false);
    }

    public override async Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        // ── Auto-set UpdatedAt ────────────────────────────────
        var entries = ChangeTracker
            .Entries()
            .Where(e =>
                e.State == EntityState.Modified
             && e.Metadata.FindProperty("UpdatedAt") != null);

        foreach (var entry in entries)
            entry.Property("UpdatedAt").CurrentValue
                = DateTime.UtcNow;

        return await base.SaveChangesAsync(cancellationToken);
    }
}
