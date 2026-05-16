using FoodBridge.Domain.Common;

namespace FoodBridge.Domain.Entities;

public class Review : BaseEntity
{
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;
    public Guid? MenuItemId { get; set; }
    public MenuItem? MenuItem { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public string? ImageUrls { get; set; }
    public string? VendorReply { get; set; }
    public DateTime? RepliedAt { get; set; }
}
