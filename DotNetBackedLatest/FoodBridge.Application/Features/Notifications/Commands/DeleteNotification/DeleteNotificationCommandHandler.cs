using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Notifications.Commands.DeleteNotification;

public class DeleteNotificationCommandHandler : IRequestHandler<DeleteNotificationCommand, Unit>
{
    private readonly IAppDbContext _db;
    public DeleteNotificationCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(DeleteNotificationCommand request, CancellationToken ct)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId && n.UserId == request.UserId, ct)
            ?? throw new NotFoundException("Notification not found.");

        _db.Notifications.Remove(notification);
        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
