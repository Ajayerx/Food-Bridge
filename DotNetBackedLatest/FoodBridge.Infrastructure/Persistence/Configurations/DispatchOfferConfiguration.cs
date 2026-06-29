using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class DispatchOfferConfiguration : IEntityTypeConfiguration<DispatchOffer>
{
    public void Configure(EntityTypeBuilder<DispatchOffer> builder)
    {
        builder.HasKey(o => o.Id);

        builder.Property(o => o.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(o => o.ExpiresAt)
            .IsRequired();

        builder.Property(o => o.CompletedAt);

        // Indexes
        builder.HasIndex(o => new { o.OrderId, o.Status })
            .HasFilter("[Status] = 'Pending'");

        // Relationships
        builder.HasOne(o => o.Order)
            .WithMany()
            .HasForeignKey(o => o.OrderId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(o => o.AcceptedByAgent)
            .WithMany()
            .HasForeignKey(o => o.AcceptedByAgentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.ToTable("DispatchOffers");
    }
}