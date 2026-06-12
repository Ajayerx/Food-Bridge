// FoodBridge.Application/Common/Interfaces/IPricingService.cs

using FoodBridge.Application.DTOs.Orders;

namespace FoodBridge.Application.Common.Interfaces;

/// <summary>
/// Calculates the authoritative price breakdown for a cart/order.
/// Both CalculateCartQueryHandler and CreateOrderCommandHandler use this —
/// the user is always charged exactly what the cart displayed.
/// </summary>
public interface IPricingService
{
    /// <summary>
    /// Computes subtotal, delivery fee (with free-delivery threshold), tax,
    /// coupon discount, and final total for a given set of items.
    /// </summary>
    Task<PriceBreakdownDto> CalculateAsync(PriceBreakdownRequestDto request, CancellationToken ct = default);
}