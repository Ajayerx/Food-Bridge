// GetMyTasksQuery.cs
using FoodBridge.Application.DTOs.Delivery;
using MediatR;
namespace FoodBridge.Application.Features.Delivery.Queries.GetMyTasks;

public record GetMyTasksQuery(
    Guid AgentUserId,
    string? Status,
    int Page,
    int PageSize)
    : IRequest<List<DeliveryTaskDto>>;