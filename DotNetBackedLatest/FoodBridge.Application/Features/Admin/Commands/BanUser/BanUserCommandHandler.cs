// BanUserCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Admin.Commands.BanUser;

public class BanUserCommandHandler
    : IRequestHandler<BanUserCommand, Unit>
{
    private readonly IAppDbContext _db;

    public BanUserCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        BanUserCommand request,
        CancellationToken ct)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(
                u => u.Id == request.TargetUserId
                  && u.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "User", request.TargetUserId);

        // Prevent banning other admins
        if (user.Role == UserRole.Admin && !request.Unban)
            throw new ForbiddenException(
                "Cannot ban an admin user.");

        user.Status = request.Unban
            ? UserStatus.Active
            : UserStatus.Banned;
        user.UpdatedAt = DateTime.UtcNow;

        // Log audit
        _db.AuditLogs.Add(new Domain.Entities.AuditLog
        {
            UserId = request.AdminUserId,
            Action = request.Unban
                ? AuditAction.Update
                : AuditAction.Delete,
            EntityName = "User",
            EntityId = request.TargetUserId.ToString(),
            Details = request.Unban
                ? "User unbanned"
                : $"User banned. Reason: {request.Reason}"
        });

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}