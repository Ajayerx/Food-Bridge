using MediatR;

namespace FoodBridge.Application.Features.Dispatch.Commands.RejectDispatchOffer;

public record RejectDispatchOfferCommand(Guid OfferId, Guid AgentUserId) : IRequest<Unit>;