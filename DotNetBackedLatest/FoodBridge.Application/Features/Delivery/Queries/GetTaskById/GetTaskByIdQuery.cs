// GetTaskByIdQuery.cs
using FoodBridge.Application.DTOs.Delivery;
using MediatR;
namespace FoodBridge.Application.Features.Delivery.Queries.GetTaskById;

public record GetTaskByIdQuery(
    Guid TaskId,
    Guid AgentUserId)
    : IRequest<DeliveryTaskDto>;