// GetOrderByIdQuery.cs
using FoodBridge.Application.DTOs.Orders;
using MediatR;
namespace FoodBridge.Application.Features.Orders.Queries.GetOrderById;

public record GetOrderByIdQuery(
    Guid OrderId,
    Guid UserId,
    string? RoleType)
    : IRequest<OrderDto>;