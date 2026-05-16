// GetOrdersQuery.cs
using FoodBridge.Application.DTOs.Orders;
using MediatR;
namespace FoodBridge.Application.Features.Orders.Queries.GetOrders;

public record GetOrdersQuery(
    Guid UserId,
    string? RoleType,
    Guid? RestaurantId,
    string? Status,
    int Page,
    int PageSize)
    : IRequest<List<OrderDto>>;