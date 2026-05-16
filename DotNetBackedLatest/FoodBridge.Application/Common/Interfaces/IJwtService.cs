namespace FoodBridge.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(Guid userId, string role);
    string GenerateRefreshToken();
    Guid? ValidateAccessToken(string token);
    string? GetRoleFromToken(string token);
}