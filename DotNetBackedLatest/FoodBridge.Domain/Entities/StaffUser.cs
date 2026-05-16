using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class StaffUser : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;
    public StaffRole StaffRole { get; set; }
    public bool IsActive { get; set; } = true;
}
