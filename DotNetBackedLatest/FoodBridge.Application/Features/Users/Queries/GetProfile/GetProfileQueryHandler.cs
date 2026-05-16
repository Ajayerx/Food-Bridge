// GetProfileQueryHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Users;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Users.Queries.GetProfile;

public class GetProfileQueryHandler
    : IRequestHandler<GetProfileQuery, UserProfileDto>
{
    private readonly IAppDbContext _db;

    public GetProfileQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<UserProfileDto> Handle(
        GetProfileQuery request,
        CancellationToken ct)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.Id == request.UserId
                  && u.DeletedAt == null, ct)
            ?? throw new NotFoundException("User", request.UserId);

        return new UserProfileDto
        {
            UserId = user.Id,
            MobileNumber = user.MobileNumber,
            Email = user.Email,
            FullName = user.FullName,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role.ToString(),
            Status = user.Status.ToString(),
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }
}