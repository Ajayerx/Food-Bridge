// GetNotificationsQuery.cs
using FoodBridge.Application.DTOs.Notifications;
using MediatR;
namespace FoodBridge.Application.Features.Notifications.Queries.GetNotifications;

public record GetNotificationsQuery(
    Guid UserId,
    bool UnreadOnly,
    int Page,
    int PageSize)
    : IRequest<GetNotificationsResult>;

public record GetNotificationsResult(
    List<NotificationDto> Items,
    int TotalCount,
    int UnreadCount);