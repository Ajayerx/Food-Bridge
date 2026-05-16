// Configurations/DeliveryTaskConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class DeliveryTaskConfiguration
    : IEntityTypeConfiguration<DeliveryTask>
{
    public void Configure(EntityTypeBuilder<DeliveryTask> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(t => t.EarningsAmount)
            .HasPrecision(10, 2)
            .HasDefaultValue(0);

        builder.Property(t => t.Notes)
            .HasMaxLength(300);

        builder.Property(t => t.AssignedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(t => t.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Indexes
        builder.HasIndex(t => t.OrderId)
            .IsUnique(); // one task per order

        builder.HasIndex(t => t.AgentId);
        builder.HasIndex(t => t.Status);

        // Relationships
        builder.HasOne(t => t.Order)
            .WithOne()
            .HasForeignKey<DeliveryTask>(t => t.OrderId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(t => t.Agent)
            .WithMany(a => a.DeliveryTasks)
            .HasForeignKey(t => t.AgentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("DeliveryTasks");
    }
}