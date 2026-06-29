using MediatR;

namespace FoodBridge.Application.Features.Dispatch.Commands.CreateAndBroadcastDispatchOffer;

public record CreateAndBroadcastDispatchOfferCommand(Guid OrderId) : IRequest<Unit>;