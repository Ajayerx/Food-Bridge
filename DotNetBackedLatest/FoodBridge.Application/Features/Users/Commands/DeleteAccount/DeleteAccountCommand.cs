using MediatR;
namespace FoodBridge.Application.Features.Users.Commands.DeleteAccount;

public record DeleteAccountCommand(Guid UserId) : IRequest<Unit>;
