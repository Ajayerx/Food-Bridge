// Configurations/DeliveryAgentConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class DeliveryAgentConfiguration
    : IEntityTypeConfiguration<DeliveryAgent>
{
    public void Configure(EntityTypeBuilder<DeliveryAgent> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.VehicleType)
            .HasMaxLength(30);

        builder.Property(a => a.VehicleNumber)
            .HasMaxLength(20);

        builder.Property(a => a.LicenseNumber)
            .HasMaxLength(30);

        builder.Property(a => a.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(a => a.CurrentLatitude)
            .HasPrecision(10, 7);

        builder.Property(a => a.CurrentLongitude)
            .HasPrecision(10, 7);

        builder.Property(a => a.TotalEarnings)
            .HasPrecision(18, 2)
            .HasDefaultValue(0);

        builder.Property(a => a.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(a => a.User)
            .WithOne(u => u.DeliveryAgent)
            .HasForeignKey<DeliveryAgent>(a => a.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasMany(a => a.DeliveryTasks)
            .WithOne(t => t.Agent)
            .HasForeignKey(t => t.AgentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("DeliveryAgents");
    }
}