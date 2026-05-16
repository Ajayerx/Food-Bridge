// MarkNotificationReadCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Notifications.Commands.MarkNotificationRead;

public record MarkNotificationReadCommand(
    Guid NotificationId,
    Guid UserId)
    : IRequest<Unit>;