// CreateReviewRequestDto.cs
namespace FoodBridge.Application.DTOs.Reviews;

public class CreateReviewRequestDto
{
    public Guid OrderId { get; set; }
    public Guid RestaurantId { get; set; }
    public Guid? MenuItemId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public List<string> ImageUrls { get; set; } = new();
}