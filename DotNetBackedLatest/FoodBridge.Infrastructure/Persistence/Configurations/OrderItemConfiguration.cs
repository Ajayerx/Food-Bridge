// Configurations/OrderItemConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class OrderItemConfiguration
    : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.HasKey(oi => oi.Id);

        builder.Property(oi => oi.ItemNameSnapshot)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(oi => oi.UnitPriceSnapshot)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(oi => oi.TotalPrice)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(oi => oi.Quantity)
            .IsRequired();

        builder.Property(oi => oi.Notes)
            .HasMaxLength(300);

        builder.Property(oi => oi.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(oi => oi.OrderId);

        // Relationships
        builder.HasOne(oi => oi.MenuItem)
            .WithMany()
            .HasForeignKey(oi => oi.MenuItemId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(oi => oi.Variant)
            .WithMany()
            .HasForeignKey(oi => oi.VariantId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasMany(oi => oi.Modifiers)
            .WithOne(m => m.OrderItem)
            .HasForeignKey(m => m.OrderItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("OrderItems");
    }
}