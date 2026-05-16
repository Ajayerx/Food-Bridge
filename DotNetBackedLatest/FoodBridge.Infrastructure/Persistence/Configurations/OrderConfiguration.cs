// Configurations/OrderConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class OrderConfiguration
    : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(o => o.Id);

        builder.Property(o => o.OrderCode)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(o => o.OrderCode)
            .IsUnique();

        builder.Property(o => o.OrderType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(o => o.OrderStatus)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(o => o.PaymentMethod)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(o => o.PaymentStatus)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(o => o.SubtotalAmount)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(o => o.TaxAmount)
            .IsRequired()
            .HasPrecision(10, 2)
            .HasDefaultValue(0);

        builder.Property(o => o.DeliveryFee)
            .IsRequired()
            .HasPrecision(10, 2)
            .HasDefaultValue(0);

        builder.Property(o => o.DiscountAmount)
            .IsRequired()
            .HasPrecision(10, 2)
            .HasDefaultValue(0);

        builder.Property(o => o.TotalAmount)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(o => o.CouponCodeSnapshot)
            .HasMaxLength(20);

        builder.Property(o => o.Notes)
            .HasMaxLength(500);

        builder.Property(o => o.CancelReason)
            .HasMaxLength(300);

        builder.Property(o => o.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Indexes
        builder.HasIndex(o => o.CustomerId);
        builder.HasIndex(o => o.RestaurantId);
        builder.HasIndex(o => o.OrderStatus);
        builder.HasIndex(o => o.CreatedAt);
        builder.HasIndex(o => o.PaymentStatus);

        // Relationships
        builder.HasOne(o => o.Customer)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(o => o.Restaurant)
            .WithMany(r => r.Orders)
            .HasForeignKey(o => o.RestaurantId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(o => o.DeliveryAddress)
            .WithMany()
            .HasForeignKey(o => o.DeliveryAddressId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(o => o.Table)
            .WithMany()
            .HasForeignKey(o => o.TableId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(o => o.Coupon)
            .WithMany()
            .HasForeignKey(o => o.CouponId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasMany(o => o.OrderItems)
            .WithOne(oi => oi.Order)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("Orders");
    }
}