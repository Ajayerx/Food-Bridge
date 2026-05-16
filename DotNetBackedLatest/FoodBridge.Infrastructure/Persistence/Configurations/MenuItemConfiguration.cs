// Configurations/MenuItemConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class MenuItemConfiguration
    : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(i => i.Description)
            .HasMaxLength(500);

        builder.Property(i => i.BasePrice)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(i => i.ImageUrl)
            .HasMaxLength(500);

        builder.Property(i => i.DietaryTag)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(i => i.PrepTimeMinutes)
            .HasDefaultValue(15);

        builder.Property(i => i.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(i => i.CategoryId);
        builder.HasIndex(i => i.IsAvailable);
        builder.HasIndex(i => i.IsFeatured);

        builder.HasMany(i => i.Variants)
            .WithOne(v => v.MenuItem)
            .HasForeignKey(v => v.MenuItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(i => i.ModifierGroups)
            .WithOne(g => g.MenuItem)
            .HasForeignKey(g => g.MenuItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("MenuItems");
    }
}