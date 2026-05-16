// GetAgentByIdQuery.cs
using FoodBridge.Application.DTOs.Agents;
using MediatR;
namespace FoodBridge.Application.Features.Agents.Queries.GetAgentById;

public record GetAgentByIdQuery(Guid AgentId)
    : IRequest<DeliveryAgentDto>;