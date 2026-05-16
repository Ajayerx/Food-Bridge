namespace FoodBridge.Domain.Common;

public abstract class CreatedOnlyEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
