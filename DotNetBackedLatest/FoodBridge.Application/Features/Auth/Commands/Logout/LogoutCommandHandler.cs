// LogoutCommandHandler.cs
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Auth.Commands.Logout;

public class LogoutCommandHandler
    : IRequestHandler<LogoutCommand, Unit>
{
    private readonly IAppDbContext _db;

    public LogoutCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        LogoutCommand request,
        CancellationToken ct)
    {
        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(
                r => r.Token == request.RefreshToken, ct);

        if (token is not null)
        {
            token.IsRevoked = true;
            await _db.SaveChangesAsync(ct);
        }

        return Unit.Value;
    }
}