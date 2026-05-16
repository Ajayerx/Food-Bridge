// Configurations/DeviceTokenConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class DeviceTokenConfiguration
    : IEntityTypeConfiguration<DeviceToken>
{
    public void Configure(EntityTypeBuilder<DeviceToken> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Token)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(d => d.Platform)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(d => d.DeviceId)
            .HasMaxLength(200);

        builder.Property(d => d.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Indexes
        builder.HasIndex(d => d.UserId);

        builder.HasIndex(d => new { d.UserId, d.Token })
            .IsUnique();

        builder.HasIndex(d => new { d.UserId, d.DeviceId })
            .HasFilter("[DeviceId] IS NOT NULL");

        // Relationships
        builder.HasOne(d => d.User)
            .WithMany(u => u.DeviceTokens)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("DeviceTokens");
    }
}