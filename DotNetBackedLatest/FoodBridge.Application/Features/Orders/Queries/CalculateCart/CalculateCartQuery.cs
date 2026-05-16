using FoodBridge.Application.DTOs.Orders;
using MediatR;
namespace FoodBridge.Application.Features.Orders.Queries.CalculateCart;

public record CalculateCartQuery(
    Guid RestaurantId,
    List<CartItemDto> Items,
    string? CouponCode,
    Guid? DeliveryAddressId,
    string OrderType,
    Guid? UserId)
    : IRequest<CartCalculateResponseDto>;
