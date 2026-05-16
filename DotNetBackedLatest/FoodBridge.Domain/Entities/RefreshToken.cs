using FoodBridge.Domain.Common;

namespace FoodBridge.Domain.Entities;

public class RefreshToken : CreatedOnlyEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; } = false;
    public string? DeviceInfo { get; set; }
}
