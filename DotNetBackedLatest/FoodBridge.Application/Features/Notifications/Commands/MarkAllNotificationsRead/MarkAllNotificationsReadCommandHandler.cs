// MarkAllNotificationsReadCommandHandler.cs
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Notifications.Commands.MarkAllNotificationsRead;

public class MarkAllNotificationsReadCommandHandler
    : IRequestHandler<MarkAllNotificationsReadCommand, Unit>
{
    private readonly IAppDbContext _db;

    public MarkAllNotificationsReadCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        MarkAllNotificationsReadCommand request,
        CancellationToken ct)
    {
        var unread = await _db.Notifications
            .Where(n => n.UserId == request.UserId
                     && n.IsRead == false)
            .ToListAsync(ct);

        if (!unread.Any())
            return Unit.Value;

        var now = DateTime.UtcNow;

        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = now;
            n.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}