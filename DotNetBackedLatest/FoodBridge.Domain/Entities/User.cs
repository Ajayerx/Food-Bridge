using FoodBridge.Domain.Common;
using FoodBridge.Domain.Enums;

namespace FoodBridge.Domain.Entities;

public class User : SoftDeleteEntity
{
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public DateTime? LastLoginAt { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public Customer? Customer { get; set; }
    public Vendor? Vendor { get; set; }
    public Admin? Admin { get; set; }
    public StaffUser? StaffUser { get; set; }
    public DeliveryAgent? DeliveryAgent { get; set; }
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<DeviceToken> DeviceTokens { get; set; } = new List<DeviceToken>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
