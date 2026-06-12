// FoodBridge.Application/Features/Orders/Queries/CalculateCart/CalculateCartQueryHandler.cs

using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Orders;
using MediatR;

namespace FoodBridge.Application.Features.Orders.Queries.CalculateCart;

public class CalculateCartQueryHandler
    : IRequestHandler<CalculateCartQuery, CartCalculateResponseDto>
{
    private readonly IPricingService _pricing;

    public CalculateCartQueryHandler(IPricingService pricing) => _pricing = pricing;

    public async Task<CartCalculateResponseDto> Handle(
        CalculateCartQuery request,
        CancellationToken ct)
    {
        var breakdown = await _pricing.CalculateAsync(new PriceBreakdownRequestDto
        {
            RestaurantId = request.RestaurantId,
            OrderType = request.OrderType,
            CouponCode = request.CouponCode,
            Items = request.Items.Select(i => new PriceBreakdownItemDto
            {
                MenuItemId = i.MenuItemId,
                VariantId = i.VariantId,
                ModifierOptionIds = i.ModifierOptionIds,
                Quantity = i.Quantity,
            }).ToList(),
        }, ct);

        // Map PriceBreakdownDto → CartCalculateResponseDto (existing API contract)
        return new CartCalculateResponseDto
        {
            SubTotal = breakdown.SubTotal,
            DeliveryFee = breakdown.DeliveryFee,
            TaxAmount = breakdown.TaxAmount,
            DiscountAmount = breakdown.DiscountAmount,
            TotalAmount = breakdown.TotalAmount,
            CouponCode = breakdown.CouponCode,
            CouponMessage = breakdown.CouponMessage,
            Items = breakdown.Items,
            IsFreeDelivery = breakdown.IsFreeDelivery,
            FreeDeliveryThreshold = breakdown.FreeDeliveryThreshold,
            AmountNeededForFreeDelivery = breakdown.AmountNeededForFreeDelivery,
        };
    }
}