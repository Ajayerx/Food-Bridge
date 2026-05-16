// RefreshTokenCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Auth;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Auth.Commands.RefreshToken;

public class RefreshTokenCommandHandler
    : IRequestHandler<RefreshTokenCommand, AuthTokensDto>
{
    private readonly IAppDbContext _db;
    private readonly IJwtService _jwtService;

    public RefreshTokenCommandHandler(
        IAppDbContext db,
        IJwtService jwtService)
    {
        _db = db;
        _jwtService = jwtService;
    }

    public async Task<AuthTokensDto> Handle(
        RefreshTokenCommand request,
        CancellationToken ct)
    {
        // 1. Find token
        var stored = await _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(
                r => r.Token == request.RefreshToken, ct)
            ?? throw new BadRequestException(
                "Invalid refresh token.");

        // 2. Validate
        if (stored.IsRevoked)
            throw new BadRequestException(
                "Refresh token has been revoked.");

        if (stored.ExpiresAt < DateTime.UtcNow)
            throw new BadRequestException(
                "Refresh token has expired.");

        // 3. Revoke old token
        stored.IsRevoked = true;

        // 4. Generate new tokens
        var newAccess = _jwtService.GenerateAccessToken(
            stored.User.Id,
            stored.User.Role.ToString());
        var newRefresh = _jwtService.GenerateRefreshToken();

        // 5. Store new refresh token
        _db.RefreshTokens.Add(new Domain.Entities.RefreshToken
        {
            UserId = stored.User.Id,
            Token = newRefresh,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        });

        await _db.SaveChangesAsync(ct);

        return new AuthTokensDto
        {
            AccessToken = newAccess,
            RefreshToken = newRefresh,
            ExpiresInMinutes = 60
        };
    }
}