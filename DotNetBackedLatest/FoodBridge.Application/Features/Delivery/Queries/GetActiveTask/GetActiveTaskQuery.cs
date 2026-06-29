using FoodBridge.Application.DTOs.Delivery;
using MediatR;

namespace FoodBridge.Application.Features.Delivery.Queries.GetActiveTask;

public record GetActiveTaskQuery(Guid AgentUserId)
    : IRequest<DeliveryTaskDto?>;
