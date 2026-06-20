// Configurations/VendorConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class VendorConfiguration
    : IEntityTypeConfiguration<Vendor>
{
    public void Configure(EntityTypeBuilder<Vendor> builder)
    {
        builder.HasKey(v => v.Id);

        builder.Property(v => v.BusinessName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(v => v.GstNumber)
            .HasMaxLength(20);

        builder.Property(v => v.PanNumber)
            .HasMaxLength(20);

        builder.Property(v => v.BankAccountNumber)
            .HasMaxLength(30);

        builder.Property(v => v.BankIfscCode)
            .HasMaxLength(15);

        builder.Property(v => v.BankHolderName)
            .HasMaxLength(200);

        builder.Property(v => v.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(v => v.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasMany(v => v.Restaurants)
            .WithOne(r => r.Vendor)
            .HasForeignKey(r => r.VendorId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasMany(v => v.Payouts)
            .WithOne(p => p.Vendor)
            .HasForeignKey(p => p.VendorId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("Vendors");
    }
}