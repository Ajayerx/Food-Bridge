// DeleteAddressCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Users.Commands.DeleteAddress;

public record DeleteAddressCommand(
    Guid AddressId,
    Guid UserId)
    : IRequest<Unit>;