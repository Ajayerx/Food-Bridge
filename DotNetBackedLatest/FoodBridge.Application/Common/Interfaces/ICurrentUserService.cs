namespace FoodBridge.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? RoleType { get; }
    bool IsAuthenticated { get; }
}