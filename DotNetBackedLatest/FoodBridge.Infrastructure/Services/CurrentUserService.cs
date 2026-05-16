using FoodBridge.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FoodBridge.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        => _httpContextAccessor = httpContextAccessor;

    private ClaimsPrincipal? Principal
        => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            // Try NameIdentifier first, fallback to Sub claim
            var value =
                Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
             ?? Principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public string? RoleType
        => Principal?.FindFirst(ClaimTypes.Role)?.Value;

    public bool IsAuthenticated
        => Principal?.Identity?.IsAuthenticated ?? false;
}