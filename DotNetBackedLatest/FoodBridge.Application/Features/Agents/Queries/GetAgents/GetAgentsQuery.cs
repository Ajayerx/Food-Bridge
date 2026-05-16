// GetAgentsQuery.cs
using FoodBridge.Application.DTOs.Agents;
using MediatR;
namespace FoodBridge.Application.Features.Agents.Queries.GetAgents;

public record GetAgentsQuery(
    string? Status,
    bool AvailableOnly,
    int Page,
    int PageSize)
    : IRequest<List<DeliveryAgentDto>>;