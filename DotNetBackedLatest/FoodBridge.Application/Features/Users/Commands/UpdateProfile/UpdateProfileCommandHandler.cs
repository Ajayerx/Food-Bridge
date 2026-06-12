// UpdateProfileCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Users;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Users.Commands.UpdateProfile;

public class UpdateProfileCommandHandler
    : IRequestHandler<UpdateProfileCommand, UserProfileDto>
{
    private readonly IAppDbContext _db;

    public UpdateProfileCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<UserProfileDto> Handle(UpdateProfileCommand request, CancellationToken ct)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.DeletedAt == null, ct)
            ?? throw new NotFoundException("User", request.UserId);

        if (request.FullName is not null) user.FullName = request.FullName;

        if (request.Email is not null)
        {
            var emailTaken = await _db.Users
                .AnyAsync(u => u.Email == request.Email && u.Id != request.UserId && u.DeletedAt == null, ct);

            if (emailTaken)
                throw new BadRequestException("This email address is already associated with another account.");

            user.Email = request.Email;
        }

        if (request.AvatarUrl is not null) user.AvatarUrl = request.AvatarUrl;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

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