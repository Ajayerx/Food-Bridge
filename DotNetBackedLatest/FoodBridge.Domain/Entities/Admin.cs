using FoodBridge.Domain.Common;

namespace FoodBridge.Domain.Entities;

public class Admin : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public bool IsSuperAdmin { get; set; } = false;
    public string? Department { get; set; }
}
