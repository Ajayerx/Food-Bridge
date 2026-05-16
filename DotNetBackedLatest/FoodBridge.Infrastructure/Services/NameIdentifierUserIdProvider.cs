// FoodBridge.Infrastructure/Services/NameIdentifierUserIdProvider.cs
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace FoodBridge.Infrastructure.Services;

public class NameIdentifierUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
        => connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? connection.User?.FindFirst("sub")?.Value;
}