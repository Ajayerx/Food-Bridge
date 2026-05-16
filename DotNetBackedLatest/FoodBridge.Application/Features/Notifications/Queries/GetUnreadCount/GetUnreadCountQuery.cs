using MediatR;
namespace FoodBridge.Application.Features.Notifications.Queries.GetUnreadCount;

public record GetUnreadCountQuery(Guid UserId) : IRequest<int>;
