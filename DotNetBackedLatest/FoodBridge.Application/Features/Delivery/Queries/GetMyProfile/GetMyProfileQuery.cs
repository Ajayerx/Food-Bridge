using FoodBridge.Application.DTOs.Agents;
using MediatR;

namespace FoodBridge.Application.Features.Delivery.Queries.GetMyProfile;

public record GetMyProfileQuery(Guid AgentUserId)
    : IRequest<DeliveryAgentDto>;
