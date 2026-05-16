// Configurations/OrderItemModifierConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class OrderItemModifierConfiguration
    : IEntityTypeConfiguration<OrderItemModifier>
{
    public void Configure(EntityTypeBuilder<OrderItemModifier> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.ModifierNameSnapshot)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(m => m.AdditionalPriceSnapshot)
            .IsRequired()
            .HasPrecision(10, 2)
            .HasDefaultValue(0);

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(m => m.OrderItemId);

        builder.HasOne(m => m.ModifierOption)
            .WithMany()
            .HasForeignKey(m => m.ModifierOptionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("OrderItemModifiers");
    }
}