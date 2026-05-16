// Configurations/RefundConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class RefundConfiguration
    : IEntityTypeConfiguration<Refund>
{
    public void Configure(EntityTypeBuilder<Refund> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Amount)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(r => r.Currency)
            .IsRequired()
            .HasMaxLength(5)
            .HasDefaultValue("INR");

        builder.Property(r => r.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(r => r.Reason)
            .HasMaxLength(300);

        builder.Property(r => r.GatewayRefundId)
            .HasMaxLength(100);

        builder.HasIndex(r => r.GatewayRefundId)
            .HasFilter("[GatewayRefundId] IS NOT NULL");

        builder.Property(r => r.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Indexes
        builder.HasIndex(r => r.PaymentId);
        builder.HasIndex(r => r.OrderId);
        builder.HasIndex(r => r.Status);

        // Relationships
        builder.HasOne(r => r.Order)
            .WithMany()
            .HasForeignKey(r => r.OrderId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(r => r.Payment)
            .WithMany(p => p.Refunds)
            .HasForeignKey(r => r.PaymentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("Refunds");
    }
}