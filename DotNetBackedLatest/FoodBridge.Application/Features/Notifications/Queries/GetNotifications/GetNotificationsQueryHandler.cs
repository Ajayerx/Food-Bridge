// GetNotificationsQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Notifications;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Notifications.Queries.GetNotifications;

public class GetNotificationsQueryHandler
    : IRequestHandler<GetNotificationsQuery, GetNotificationsResult>
{
    private readonly IAppDbContext _db;

    public GetNotificationsQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<GetNotificationsResult> Handle(
        GetNotificationsQuery request,
        CancellationToken ct)
    {
        var baseQuery = _db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == request.UserId);

        // Unread count
        var unreadCount = await baseQuery
            .CountAsync(n => !n.IsRead, ct);

        // Total count
        var totalCount = await baseQuery
            .CountAsync(ct);

        // Apply unread filter
        if (request.UnreadOnly)
            baseQuery = baseQuery
                .Where(n => n.IsRead == false);

        var notifications = await baseQuery
            .OrderByDescending(n => n.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var items = notifications.Select(n => new NotificationDto
        {
            Id = n.Id,
            UserId = n.UserId,
            Title = n.Title,
            Body = n.Body,
            Type = n.Type.ToString(),
            IsRead = n.IsRead,
            ImageUrl = n.ImageUrl,
            ActionUrl = n.ActionUrl,
            Data = n.Data,
            CreatedAt = n.CreatedAt,
            ReadAt = n.ReadAt
        }).ToList();

        return new GetNotificationsResult(
            Items: items,
            TotalCount: totalCount,
            UnreadCount: unreadCount);
    }
}