// Configurations/RestaurantTableConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class RestaurantTableConfiguration
    : IEntityTypeConfiguration<RestaurantTable>
{
    public void Configure(EntityTypeBuilder<RestaurantTable> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.TableNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(t => t.Capacity)
            .IsRequired();

        builder.Property(t => t.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(t => new { t.RestaurantId, t.TableNumber })
            .IsUnique();

        builder.ToTable("RestaurantTables");
    }
}