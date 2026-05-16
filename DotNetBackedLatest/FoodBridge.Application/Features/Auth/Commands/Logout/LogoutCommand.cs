// LogoutCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Auth.Commands.Logout;

public record LogoutCommand(string RefreshToken)
    : IRequest<Unit>;