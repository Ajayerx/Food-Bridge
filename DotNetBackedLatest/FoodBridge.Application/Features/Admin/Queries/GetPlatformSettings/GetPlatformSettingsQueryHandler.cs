using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Admin;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Admin.Queries.GetPlatformSettings;

public class GetPlatformSettingsQueryHandler
    : IRequestHandler<GetPlatformSettingsQuery, List<PlatformSettingDto>>
{
    private readonly IAppDbContext _db;

    public GetPlatformSettingsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<List<PlatformSettingDto>> Handle(
        GetPlatformSettingsQuery request,
        CancellationToken ct)
    {
        var settings = await _db.PlatformSettings
            .AsNoTracking()
            .OrderBy(s => s.Key)
            .Select(s => new PlatformSettingDto
            {
                Id = s.Id,
                Key = s.Key,
                Value = s.Value,
                Description = s.Description,
                UpdatedAt = s.UpdatedAt ?? DateTime.UtcNow
            })
            .ToListAsync(ct);

        return settings;
    }
}