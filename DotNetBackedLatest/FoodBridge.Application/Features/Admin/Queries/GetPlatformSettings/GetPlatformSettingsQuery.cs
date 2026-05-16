using FoodBridge.Application.DTOs.Admin;
using MediatR;

namespace FoodBridge.Application.Features.Admin.Queries.GetPlatformSettings;

public record GetPlatformSettingsQuery()
    : IRequest<List<PlatformSettingDto>>;