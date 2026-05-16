// RefreshTokenCommand.cs
using FoodBridge.Application.DTOs.Auth;
using MediatR;
namespace FoodBridge.Application.Features.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string RefreshToken)
    : IRequest<AuthTokensDto>;