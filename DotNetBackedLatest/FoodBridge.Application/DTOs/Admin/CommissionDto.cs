namespace FoodBridge.Application.DTOs.Admin;

public class CommissionDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid RestaurantId { get; set; }
    public string RestaurantName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Rate { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public Guid? VendorPayoutId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateCommissionRequestDto
{
    public decimal Rate { get; set; }
    public string Type { get; set; } = "Percentage";
    public string? Notes { get; set; }
}
