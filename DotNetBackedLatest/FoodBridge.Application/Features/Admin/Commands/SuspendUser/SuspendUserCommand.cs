using MediatR;
namespace FoodBridge.Application.Features.Admin.Commands.SuspendUser;

public record SuspendUserCommand(
    Guid TargetUserId,
    Guid AdminUserId,
    bool Reactivate = false)
    : IRequest<Unit>;
