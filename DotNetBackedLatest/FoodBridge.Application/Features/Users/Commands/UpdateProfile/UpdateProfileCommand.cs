// UpdateProfileCommand.cs
using FoodBridge.Application.DTOs.Users;
using MediatR;
namespace FoodBridge.Application.Features.Users.Commands.UpdateProfile;

public record UpdateProfileCommand(
    Guid UserId,
    string? FullName,
    string? Email,
    string? AvatarUrl)
    : IRequest<UserProfileDto>;