// BanUserCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Admin.Commands.BanUser;

public record BanUserCommand(
    Guid TargetUserId,
    Guid AdminUserId,
    string? Reason,
    bool Unban = false)
    : IRequest<Unit>;