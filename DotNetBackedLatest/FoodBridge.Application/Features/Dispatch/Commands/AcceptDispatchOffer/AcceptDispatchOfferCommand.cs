using MediatR;

namespace FoodBridge.Application.Features.Dispatch.Commands.AcceptDispatchOffer;

public record AcceptDispatchOfferCommand(Guid OfferId, Guid AgentUserId) : IRequest<Unit>;