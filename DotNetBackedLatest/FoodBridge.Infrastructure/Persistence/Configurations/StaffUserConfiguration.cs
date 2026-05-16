// Configurations/StaffUserConfiguration.cs
using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class StaffUserConfiguration
    : IEntityTypeConfiguration<StaffUser>
{
    public void Configure(EntityTypeBuilder<StaffUser> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.StaffRole)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(s => s.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(s => s.User)
            .WithOne(u => u.StaffUser)
            .HasForeignKey<StaffUser>(s => s.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(s => s.Restaurant)
            .WithMany(r => r.Staff)
            .HasForeignKey(s => s.RestaurantId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("StaffUsers");
    }
}