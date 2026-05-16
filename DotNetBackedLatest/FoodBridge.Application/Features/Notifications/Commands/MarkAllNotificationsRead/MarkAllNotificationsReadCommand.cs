// MarkAllNotificationsReadCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Notifications.Commands.MarkAllNotificationsRead;

public record MarkAllNotificationsReadCommand(Guid UserId)
    : IRequest<Unit>;