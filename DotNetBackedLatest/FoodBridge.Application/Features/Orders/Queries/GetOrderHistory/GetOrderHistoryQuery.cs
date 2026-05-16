// GetOrderHistoryQuery.cs
using FoodBridge.Application.DTOs.Orders;
using MediatR;
namespace FoodBridge.Application.Features.Orders.Queries.GetOrderHistory;

public record GetOrderHistoryQuery(
    Guid UserId,
    int Page,
    int PageSize)
    : IRequest<List<OrderDto>>;