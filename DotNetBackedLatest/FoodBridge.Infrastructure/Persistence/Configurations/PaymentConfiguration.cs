// Configurations/PaymentConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration
    : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Amount)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(p => p.Currency)
            .IsRequired()
            .HasMaxLength(5)
            .HasDefaultValue("INR");

        builder.Property(p => p.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(p => p.Method)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(p => p.GatewayOrderId)
            .HasMaxLength(100);

        builder.HasIndex(p => p.GatewayOrderId)
            .HasFilter("[GatewayOrderId] IS NOT NULL");

        builder.Property(p => p.GatewayPaymentId)
            .HasMaxLength(100);

        builder.HasIndex(p => p.GatewayPaymentId)
            .HasFilter("[GatewayPaymentId] IS NOT NULL");

        builder.Property(p => p.FailureReason)
            .HasMaxLength(500);

        builder.Property(p => p.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Indexes
        builder.HasIndex(p => p.OrderId);
        builder.HasIndex(p => p.Status);

        // Relationships
        builder.HasOne(p => p.Order)
            .WithMany()
            .HasForeignKey(p => p.OrderId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasMany(p => p.Refunds)
            .WithOne(r => r.Payment)
            .HasForeignKey(r => r.PaymentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("Payments");
    }
}