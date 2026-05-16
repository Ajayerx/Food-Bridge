// CreateOrderCommand.cs
using FoodBridge.Application.DTOs.Orders;
using MediatR;
namespace FoodBridge.Application.Features.Orders.Commands.CreateOrder;

public record CreateOrderCommand(
    Guid UserId,             
    Guid RestaurantId,
    string OrderType,
    Guid? DeliveryAddressId,
    Guid? TableId,
    List<OrderItemRequestDto> Items,
    string? CouponCode,
    string? PaymentMethod,
    string? Notes)
    : IRequest<OrderDto>;