// Configurations/CommissionConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class CommissionConfiguration
    : IEntityTypeConfiguration<Commission>
{
    public void Configure(EntityTypeBuilder<Commission> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Amount)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(c => c.Rate)
            .IsRequired()
            .HasPrecision(5, 2);

        builder.Property(c => c.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(c => c.Notes)
            .HasMaxLength(300);

        builder.Property(c => c.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // One commission per order
        builder.HasIndex(c => c.OrderId)
            .IsUnique();

        builder.HasIndex(c => c.RestaurantId);
        builder.HasIndex(c => c.VendorPayoutId)
            .HasFilter("[VendorPayoutId] IS NOT NULL");

        // Relationships
        builder.HasOne(c => c.Order)
            .WithMany()
            .HasForeignKey(c => c.OrderId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(c => c.Restaurant)
            .WithMany()
            .HasForeignKey(c => c.RestaurantId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("Commissions");
    }
}