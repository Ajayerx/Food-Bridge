// Configurations/CouponConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class CouponConfiguration
    : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Code)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(c => c.Code)
            .IsUnique();

        builder.Property(c => c.Description)
            .HasMaxLength(300);

        builder.Property(c => c.CouponType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(c => c.DiscountValue)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(c => c.MinOrderAmount)
            .IsRequired()
            .HasPrecision(10, 2)
            .HasDefaultValue(0);

        builder.Property(c => c.MaxDiscountAmount)
            .HasPrecision(10, 2);

        builder.Property(c => c.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(c => c.UsageCount)
            .HasDefaultValue(0);

        builder.Property(c => c.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(c => c.Status);
        builder.HasIndex(c => c.RestaurantId);

        builder.HasOne(c => c.Restaurant)
            .WithMany()
            .HasForeignKey(c => c.RestaurantId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("Coupons");
    }
}