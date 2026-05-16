// FoodBridge.Infrastructure/Persistence/Configurations/ModifierGroupConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class ModifierGroupConfiguration : IEntityTypeConfiguration<ModifierGroup>
{
    public void Configure(EntityTypeBuilder<ModifierGroup> builder)
    {
        builder.ToTable("ModifierGroups", "dbo");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(g => g.IsRequired)
            .HasDefaultValue(false);

        builder.Property(g => g.MaxSelections)
            .HasDefaultValue(1);

        builder.Property(g => g.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // ── Fix: NO CASCADE on both FKs ──────────────────────
        builder.HasOne(g => g.Restaurant)
            .WithMany()
            .HasForeignKey(g => g.RestaurantId)
            .OnDelete(DeleteBehavior.NoAction);  // ← was Cascade

        builder.HasOne(g => g.MenuItem)
            .WithMany(i => i.ModifierGroups)
            .HasForeignKey(g => g.MenuItemId)
            .OnDelete(DeleteBehavior.NoAction);  // ← was Cascade
    }
}