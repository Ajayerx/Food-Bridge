using FoodBridge.Application.Features.Users.Commands.SetDefaultAddress;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using FoodBridge.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FoodBridge.Tests.Application.Addresses;

public class SetDefaultAddressIntegrationTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var ctx = new AppDbContext(options);

        // Apply configurations manually since InMemory doesn't run migrations
        ctx.Database.EnsureCreated();
        return ctx;
    }

    private static AddAddressCommand AddCmd => new(
        UserId: Guid.NewGuid(),
        Label: "Home",
        AddressLine1: "123 Main St",
        AddressLine2: null,
        City: "Indore",
        State: "Madhya Pradesh",
        PinCode: "452010",
        Latitude: 22.7196m,
        Longitude: 75.8577m,
        IsDefault: false);

    private record AddAddressCommand(
        Guid UserId,
        string Label,
        string? AddressLine2,
        string AddressLine1,
        string City,
        string State,
        string PinCode,
        decimal Latitude,
        decimal Longitude,
        bool IsDefault);

    [Fact]
    public async Task SetDefault_Clears_Previous_Default_And_Sets_New_One()
    {
        // ── Arrange ─────────────────────────────────────────────────────
        var db = CreateDbContext();

        var user = new User
        {
            MobileNumber = "9999999999",
            Role = UserRole.Customer,
            Status = UserStatus.Active
        };
        db.Users.Add(user);

        var customer = new Customer
        {
            UserId = user.Id,
            User = user
        };
        db.Customers.Add(customer);

        // Create 3 addresses for this customer
        var addr1 = new CustomerAddress
        {
            CustomerId = customer.Id,
            Label = "Home",
            AddressLine1 = "123 Main St",
            City = "Indore",
            State = "Madhya Pradesh",
            PinCode = "452010",
            Latitude = 22.7196m,
            Longitude = 75.8577m,
            IsDefault = true
        };

        var addr2 = new CustomerAddress
        {
            CustomerId = customer.Id,
            Label = "Work",
            AddressLine1 = "456 Office Rd",
            City = "Mumbai",
            State = "Maharashtra",
            PinCode = "400001",
            Latitude = 19.0760m,
            Longitude = 72.8777m,
            IsDefault = false
        };

        var addr3 = new CustomerAddress
        {
            CustomerId = customer.Id,
            Label = "Other",
            AddressLine1 = "789 Lake View",
            City = "Pune",
            State = "Maharashtra",
            PinCode = "411001",
            Latitude = 18.5204m,
            Longitude = 73.8567m,
            IsDefault = false
        };

        db.CustomerAddresses.AddRange(addr1, addr2, addr3);
        await db.SaveChangesAsync();

        // Verify setup: only addr1 is default
        Assert.True((await db.CustomerAddresses.FindAsync(addr1.Id))!.IsDefault);
        Assert.False((await db.CustomerAddresses.FindAsync(addr2.Id))!.IsDefault);
        Assert.False((await db.CustomerAddresses.FindAsync(addr3.Id))!.IsDefault);

        // ── Act ─────────────────────────────────────────────────────────
        var handler = new SetDefaultAddressCommandHandler(
            new TestAppDbContext(db));

        await handler.Handle(
            new SetDefaultAddressCommand(addr3.Id, user.Id),
            CancellationToken.None);

        // ── Assert ──────────────────────────────────────────────────────
        // addr3 is now default
        Assert.True((await db.CustomerAddresses.FindAsync(addr3.Id))!.IsDefault);

        // addr1 is no longer default
        Assert.False((await db.CustomerAddresses.FindAsync(addr1.Id))!.IsDefault);

        // addr2 is still not default
        Assert.False((await db.CustomerAddresses.FindAsync(addr2.Id))!.IsDefault);

        // Only one address is default for this customer
        var defaultCount = await db.CustomerAddresses
            .CountAsync(a => a.CustomerId == customer.Id && a.IsDefault);
        Assert.Equal(1, defaultCount);
    }
}

/// <summary>
/// Adapter to expose the in-memory DbContext through IAppDbContext
/// </summary>
internal class TestAppDbContext : FoodBridge.Application.Common.Interfaces.IAppDbContext
{
    private readonly AppDbContext _inner;

    public TestAppDbContext(AppDbContext inner) => _inner = inner;

    public DbSet<User> Users => _inner.Users;
    public DbSet<RefreshToken> RefreshTokens => _inner.RefreshTokens;
    public DbSet<Customer> Customers => _inner.Customers;
    public DbSet<CustomerAddress> CustomerAddresses => _inner.CustomerAddresses;
    public DbSet<Vendor> Vendors => _inner.Vendors;
    public DbSet<Admin> Admins => _inner.Admins;
    public DbSet<StaffUser> StaffUsers => _inner.StaffUsers;
    public DbSet<DeliveryAgent> DeliveryAgents => _inner.DeliveryAgents;
    public DbSet<Restaurant> Restaurants => _inner.Restaurants;
    public DbSet<RestaurantTable> RestaurantTables => _inner.RestaurantTables;
    public DbSet<MenuCategory> MenuCategories => _inner.MenuCategories;
    public DbSet<MenuItem> MenuItems => _inner.MenuItems;
    public DbSet<ItemVariant> ItemVariants => _inner.ItemVariants;
    public DbSet<ModifierGroup> ModifierGroups => _inner.ModifierGroups;
    public DbSet<ModifierOption> ModifierOptions => _inner.ModifierOptions;
    public DbSet<Order> Orders => _inner.Orders;
    public DbSet<OrderItem> OrderItems => _inner.OrderItems;
    public DbSet<OrderItemModifier> OrderItemModifiers => _inner.OrderItemModifiers;
    public DbSet<Coupon> Coupons => _inner.Coupons;
    public DbSet<CouponRedemption> CouponRedemptions => _inner.CouponRedemptions;
    public DbSet<DeliveryTask> DeliveryTasks => _inner.DeliveryTasks;
    public DbSet<Payment> Payments => _inner.Payments;
    public DbSet<Refund> Refunds => _inner.Refunds;
    public DbSet<Commission> Commissions => _inner.Commissions;
    public DbSet<VendorPayout> VendorPayouts => _inner.VendorPayouts;
    public DbSet<Review> Reviews => _inner.Reviews;
    public DbSet<SupportTicket> SupportTickets => _inner.SupportTickets;
    public DbSet<TicketMessage> TicketMessages => _inner.TicketMessages;
    public DbSet<Notification> Notifications => _inner.Notifications;
    public DbSet<DeviceToken> DeviceTokens => _inner.DeviceTokens;
    public DbSet<PlatformSetting> PlatformSettings => _inner.PlatformSettings;
    public DbSet<AuditLog> AuditLogs => _inner.AuditLogs;
    public DbSet<Banner> Banners => _inner.Banners;

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _inner.SaveChangesAsync(cancellationToken);
}
