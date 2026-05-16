// Configurations/CustomerAddressConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class CustomerAddressConfiguration
    : IEntityTypeConfiguration<CustomerAddress>
{
    public void Configure(EntityTypeBuilder<CustomerAddress> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Label)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.AddressLine1)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(a => a.AddressLine2)
            .HasMaxLength(300);

        builder.Property(a => a.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.State)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.PinCode)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(a => a.Latitude)
            .HasPrecision(10, 7);

        builder.Property(a => a.Longitude)
            .HasPrecision(10, 7);

        builder.Property(a => a.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.ToTable("CustomerAddresses");
    }
}