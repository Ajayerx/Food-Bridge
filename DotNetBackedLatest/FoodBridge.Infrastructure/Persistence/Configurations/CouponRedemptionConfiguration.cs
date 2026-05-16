// Configurations/CouponRedemptionConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class CouponRedemptionConfiguration
    : IEntityTypeConfiguration<CouponRedemption>
{
    public void Configure(EntityTypeBuilder<CouponRedemption> builder)
    {
        builder.HasKey(cr => cr.Id);

        builder.Property(cr => cr.DiscountAmount)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(cr => cr.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Prevent duplicate redemption per order
        builder.HasIndex(cr => new
        {
            cr.CouponId,
            cr.OrderId
        }).IsUnique();

        builder.HasIndex(cr => cr.CustomerId);
        builder.HasIndex(cr => cr.CouponId);

        builder.HasOne(cr => cr.Coupon)
            .WithMany()
            .HasForeignKey(cr => cr.CouponId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(cr => cr.Customer)
            .WithMany(c => c.CouponRedemptions)
            .HasForeignKey(cr => cr.CustomerId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(cr => cr.Order)
            .WithMany()
            .HasForeignKey(cr => cr.OrderId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("CouponRedemptions");
    }
}