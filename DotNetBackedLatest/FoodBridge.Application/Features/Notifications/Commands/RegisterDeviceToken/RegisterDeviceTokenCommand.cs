// RegisterDeviceTokenCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Notifications.Commands.RegisterDeviceToken;

public record RegisterDeviceTokenCommand(
    Guid UserId,
    string Token,
    string Platform,
    string? DeviceId)
    : IRequest<Unit>;