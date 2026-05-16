// UpdatePlatformSettingCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Admin.Commands.UpdatePlatformSetting;

public record UpdatePlatformSettingCommand(
    string Key,
    string Value,
    Guid AdminUserId)
    : IRequest<Unit>;