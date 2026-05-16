// RegisterDeviceTokenCommandHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Notifications.Commands.RegisterDeviceToken;

public class RegisterDeviceTokenCommandHandler
    : IRequestHandler<RegisterDeviceTokenCommand, Unit>
{
    private readonly IAppDbContext _db;

    public RegisterDeviceTokenCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        RegisterDeviceTokenCommand request,
        CancellationToken ct)
    {
        // 1. Check if token already exists for this user
        var existing = await _db.DeviceTokens
            .FirstOrDefaultAsync(
                d => d.UserId == request.UserId
                  && d.Token == request.Token, ct);

        if (existing is not null)
        {
            // Refresh updated time
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Unit.Value;
        }

        // 2. Deactivate old tokens for same device
        if (!string.IsNullOrEmpty(request.DeviceId))
        {
            var oldTokens = await _db.DeviceTokens
                .Where(d => d.UserId == request.UserId
                         && d.DeviceId == request.DeviceId)
                .ToListAsync(ct);

            _db.DeviceTokens.RemoveRange(oldTokens);
        }

        // 3. Register new token
        var platform = Enum.TryParse<DevicePlatform>(
            request.Platform, out var p)
            ? p
            : DevicePlatform.Android;

        var deviceToken = new DeviceToken
        {
            UserId = request.UserId,
            Token = request.Token,
            Platform = platform,
            DeviceId = request.DeviceId
        };

        _db.DeviceTokens.Add(deviceToken);
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}