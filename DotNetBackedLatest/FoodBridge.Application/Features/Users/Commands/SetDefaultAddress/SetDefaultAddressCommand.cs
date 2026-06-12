// SetDefaultAddressCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Users.Commands.SetDefaultAddress;

public record SetDefaultAddressCommand(
    Guid AddressId,
    Guid UserId)
    : IRequest<Unit>;
