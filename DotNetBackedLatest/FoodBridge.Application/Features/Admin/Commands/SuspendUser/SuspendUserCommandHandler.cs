using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Admin.Commands.SuspendUser;

public class SuspendUserCommandHandler : IRequestHandler<SuspendUserCommand, Unit>
{
    private readonly IAppDbContext _db;
    public SuspendUserCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(SuspendUserCommand request, CancellationToken ct)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == request.TargetUserId, ct)
            ?? throw new NotFoundException("User not found.");

        user.Status = request.Reactivate ? UserStatus.Active : UserStatus.Inactive;

        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
