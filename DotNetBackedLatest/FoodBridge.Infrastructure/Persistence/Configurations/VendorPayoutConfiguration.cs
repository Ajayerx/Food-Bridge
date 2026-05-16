// Configurations/VendorPayoutConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class VendorPayoutConfiguration
    : IEntityTypeConfiguration<VendorPayout>
{
    public void Configure(EntityTypeBuilder<VendorPayout> builder)
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
            .HasMaxLength(20);

        builder.Property(p => p.TransactionId)
            .HasMaxLength(100);

        builder.HasIndex(p => p.TransactionId)
            .HasFilter("[TransactionId] IS NOT NULL");

        builder.Property(p => p.BankAccountNumber)
            .HasMaxLength(30);

        builder.Property(p => p.BankIfscCode)
            .HasMaxLength(15);

        builder.Property(p => p.Notes)
            .HasMaxLength(300);

        builder.Property(p => p.PeriodFrom)
            .IsRequired();

        builder.Property(p => p.PeriodTo)
            .IsRequired();

        builder.Property(p => p.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Indexes
        builder.HasIndex(p => p.VendorId);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => new { p.VendorId, p.PeriodFrom, p.PeriodTo });

        // Relationships
        builder.HasOne(p => p.Vendor)
            .WithMany(v => v.Payouts)
            .HasForeignKey(p => p.VendorId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasMany(p => p.Commissions)
            .WithOne(c => c.VendorPayout)
            .HasForeignKey(c => c.VendorPayoutId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("VendorPayouts");
    }
}