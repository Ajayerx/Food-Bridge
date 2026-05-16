// Configurations/PlatformSettingConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class PlatformSettingConfiguration
    : IEntityTypeConfiguration<PlatformSetting>
{
    public void Configure(EntityTypeBuilder<PlatformSetting> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Key)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(s => s.Key)
            .IsUnique();

        builder.Property(s => s.Value)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(s => s.Description)
            .HasMaxLength(500);

        builder.Property(s => s.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Seed default platform settings
        builder.HasData(
            new PlatformSetting
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000001"),
                Key = "platform_commission_rate",
                Value = "10",
                Description = "Platform commission percentage on each order",
                CreatedAt = DateTime.UtcNow
            },
            new PlatformSetting
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000002"),
                Key = "default_tax_rate",
                Value = "5",
                Description = "Default GST tax rate percentage",
                CreatedAt = DateTime.UtcNow
            },
            new PlatformSetting
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000003"),
                Key = "max_delivery_radius_km",
                Value = "10",
                Description = "Maximum delivery radius in kilometers",
                CreatedAt = DateTime.UtcNow
            },
            new PlatformSetting
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000004"),
                Key = "otp_expiry_seconds",
                Value = "300",
                Description = "OTP expiry time in seconds",
                CreatedAt = DateTime.UtcNow
            },
            new PlatformSetting
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000005"),
                Key = "min_payout_amount",
                Value = "500",
                Description = "Minimum vendor payout amount in INR",
                CreatedAt = DateTime.UtcNow
            },
            new PlatformSetting
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000006"),
                Key = "agent_delivery_earnings_per_order",
                Value = "30",
                Description = "Default agent earnings per delivery in INR",
                CreatedAt = DateTime.UtcNow
            },
            new PlatformSetting
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000007"),
                Key = "support_email",
                Value = "support@foodbridge.in",
                Description = "Support email address",
                CreatedAt = DateTime.UtcNow
            },
            new PlatformSetting
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000008"),
                Key = "support_phone",
                Value = "+91-9999999999",
                Description = "Support phone number",
                CreatedAt = DateTime.UtcNow
            }
        );

        builder.ToTable("PlatformSettings");
    }
}