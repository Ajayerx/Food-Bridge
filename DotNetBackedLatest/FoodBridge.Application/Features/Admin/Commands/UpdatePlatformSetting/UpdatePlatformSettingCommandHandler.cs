using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Admin.Commands.UpdatePlatformSetting;

public class UpdatePlatformSettingCommandHandler
    : IRequestHandler<UpdatePlatformSettingCommand, Unit>
{
    private readonly IAppDbContext _db;

    public UpdatePlatformSettingCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<Unit> Handle(
        UpdatePlatformSettingCommand request,
        CancellationToken ct)
    {
        // 🔒 Basic validation
        if (string.IsNullOrWhiteSpace(request.Key))
            throw new ArgumentException("Setting key is required");

        if (string.IsNullOrWhiteSpace(request.Value))
            throw new ArgumentException("Setting value is required");

        // 1. Find existing setting
        var setting = await _db.PlatformSettings
            .FirstOrDefaultAsync(s => s.Key == request.Key, ct);

        if (setting is null)
        {
            // 2a. Create new setting
            setting = new PlatformSetting
            {
                Id = Guid.NewGuid(), // ❗ IMPORTANT (missing in your code)
                Key = request.Key,
                Value = request.Value,
                Description = null,
                UpdatedAt = DateTime.UtcNow
            };

            _db.PlatformSettings.Add(setting);
        }
        else
        {
            // 2b. Update existing
            setting.Value = request.Value;
            setting.UpdatedAt = DateTime.UtcNow;
        }

        // 3. Audit log (✅ Improved)
        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(), // ❗ ensure PK
            UserId = request.AdminUserId,
            Action = AuditAction.Update,
            EntityName = "PlatformSetting",
            EntityId = setting.Id.ToString(), // ✅ Better than Key
            Details = $"Setting '{request.Key}' updated to '{request.Value}'",
            CreatedAt = DateTime.UtcNow // ❗ recommended
        });

        // 4. Save changes
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}