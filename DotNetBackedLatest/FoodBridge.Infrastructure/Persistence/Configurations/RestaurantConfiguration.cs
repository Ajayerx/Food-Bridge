// Configurations/RestaurantConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class RestaurantConfiguration
    : IEntityTypeConfiguration<Restaurant>
{
    public void Configure(EntityTypeBuilder<Restaurant> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(r => r.Description)
            .HasMaxLength(1000);

        builder.Property(r => r.Cuisines)
            .HasMaxLength(2000);

        builder.Property(r => r.OperatingHours)
            .HasMaxLength(2000);

        builder.Property(r => r.LogoUrl)
            .HasMaxLength(500);

        builder.Property(r => r.CoverImageUrl)
            .HasMaxLength(500);

        builder.Property(r => r.AddressLine)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(r => r.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(r => r.State)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(r => r.PinCode)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(r => r.Latitude)
            .HasPrecision(10, 7);

        builder.Property(r => r.Longitude)
            .HasPrecision(10, 7);

        builder.Property(r => r.PhoneNumber)
            .HasMaxLength(15);

        builder.Property(r => r.FssaiLicense)
            .HasMaxLength(20);

        builder.Property(r => r.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(r => r.DeliveryFee)
            .HasPrecision(10, 2)
            .HasDefaultValue(0);

        builder.Property(r => r.MinOrderAmount)
            .HasPrecision(10, 2)
            .HasDefaultValue(0);

        builder.Property(r => r.AvgRating)
            .HasPrecision(3, 1);

        builder.Property(r => r.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Indexes
        builder.HasIndex(r => r.City);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.VendorId);

        // Relationships
        builder.HasMany(r => r.Tables)
            .WithOne(t => t.Restaurant)
            .HasForeignKey(t => t.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.MenuCategories)
            .WithOne(c => c.Restaurant)
            .HasForeignKey(c => c.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Staff)
            .WithOne(s => s.Restaurant)
            .HasForeignKey(s => s.RestaurantId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasMany(r => r.Orders)
            .WithOne(o => o.Restaurant)
            .HasForeignKey(o => o.RestaurantId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasMany(r => r.Reviews)
            .WithOne(rv => rv.Restaurant)
            .HasForeignKey(rv => rv.RestaurantId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("Restaurants");
    }
}