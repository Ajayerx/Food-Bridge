// MarkNotificationReadCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Notifications.Commands.MarkNotificationRead;

public class MarkNotificationReadCommandHandler
    : IRequestHandler<MarkNotificationReadCommand, Unit>
{
    private readonly IAppDbContext _db;

    public MarkNotificationReadCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        MarkNotificationReadCommand request,
        CancellationToken ct)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(
                n => n.Id == request.NotificationId
                  && n.UserId == request.UserId, ct)
            ?? throw new NotFoundException(
                "Notification", request.NotificationId);

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            notification.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);
        }

        return Unit.Value;
    }
}