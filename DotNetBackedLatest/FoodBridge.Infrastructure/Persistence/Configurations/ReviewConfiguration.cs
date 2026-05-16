// Configurations/ReviewConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class ReviewConfiguration
    : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Rating)
            .IsRequired();

        builder.Property(r => r.Comment)
            .HasMaxLength(500);

        builder.Property(r => r.ImageUrls)
            .HasMaxLength(2000);

        builder.Property(r => r.VendorReply)
            .HasMaxLength(500);

        builder.Property(r => r.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Indexes
        builder.HasIndex(r => r.RestaurantId);
        builder.HasIndex(r => r.CustomerId);
        builder.HasIndex(r => r.MenuItemId)
            .HasFilter("[MenuItemId] IS NOT NULL");
        builder.HasIndex(r => r.OrderId);

        // Prevent duplicate reviews per order per restaurant
        builder.HasIndex(r => new
        {
            r.OrderId,
            r.CustomerId,
            r.RestaurantId
        }).HasFilter("[MenuItemId] IS NULL");

        // Relationships
        builder.HasOne(r => r.Customer)
            .WithMany(c => c.Reviews)
            .HasForeignKey(r => r.CustomerId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(r => r.Restaurant)
            .WithMany(res => res.Reviews)
            .HasForeignKey(r => r.RestaurantId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(r => r.MenuItem)
            .WithMany()
            .HasForeignKey(r => r.MenuItemId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(r => r.Order)
            .WithMany()
            .HasForeignKey(r => r.OrderId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("Reviews");
    }
}