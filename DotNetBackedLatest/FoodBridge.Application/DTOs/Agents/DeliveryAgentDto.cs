// DeliveryAgentDto.cs
namespace FoodBridge.Application.DTOs.Agents;

public class DeliveryAgentDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public string? VehicleType { get; set; }
    public string? VehicleNumber { get; set; }
    public string? LicenseNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public decimal? CurrentLatitude { get; set; }
    public decimal? CurrentLongitude { get; set; }
    public decimal TotalEarnings { get; set; }
    public int TotalDeliveries { get; set; }
    public DateTime CreatedAt { get; set; }
}