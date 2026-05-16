// ValidateCouponRequestDto.cs
namespace FoodBridge.Application.DTOs.Coupons;

public class ValidateCouponRequestDto
{
    public string Code { get; set; } = string.Empty;
    public Guid RestaurantId { get; set; }
    public decimal OrderAmount { get; set; }
}