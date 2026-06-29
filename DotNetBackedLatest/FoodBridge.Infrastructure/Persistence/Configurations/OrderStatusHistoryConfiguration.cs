using FoodBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodBridge.Infrastructure.Persistence.Configurations;

public class OrderStatusHistoryConfiguration
    : IEntityTypeConfiguration<OrderStatusHistory>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistory> builder)
    {
        builder.HasKey(h => h.Id);

        builder.Property(h => h.FromStatus)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(h => h.ToStatus)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(h => h.ChangedByRole)
            .HasMaxLength(30);

        builder.Property(h => h.Reason)
            .HasMaxLength(500);

        builder.Property(h => h.ChangedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(h => h.Order)
            .WithMany()
            .HasForeignKey(h => h.OrderId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(h => h.OrderId);
        builder.HasIndex(h => h.ChangedAt);

        builder.ToTable("OrderStatusHistories");
    }
}
