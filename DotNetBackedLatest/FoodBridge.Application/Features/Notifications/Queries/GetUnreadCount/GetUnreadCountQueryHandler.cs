using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Notifications.Queries.GetUnreadCount;

public class GetUnreadCountQueryHandler : IRequestHandler<GetUnreadCountQuery, int>
{
    private readonly IAppDbContext _db;
    public GetUnreadCountQueryHandler(IAppDbContext db) => _db = db;

    public Task<int> Handle(GetUnreadCountQuery request, CancellationToken ct)
        => _db.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == request.UserId && !n.IsRead, ct);
}
