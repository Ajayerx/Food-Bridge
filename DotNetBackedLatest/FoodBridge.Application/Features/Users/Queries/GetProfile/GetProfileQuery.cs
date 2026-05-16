// GetProfileQuery.cs
using FoodBridge.Application.DTOs.Users;
using MediatR;
namespace FoodBridge.Application.Features.Users.Queries.GetProfile;

public record GetProfileQuery(Guid UserId)
    : IRequest<UserProfileDto>;