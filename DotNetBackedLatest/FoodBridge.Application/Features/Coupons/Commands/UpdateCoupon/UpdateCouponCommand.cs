// UpdateCouponCommand.cs
using FoodBridge.Application.DTOs.Coupons;
using MediatR;
namespace FoodBridge.Application.Features.Coupons.Commands.UpdateCoupon;

public record UpdateCouponCommand(
    Guid CouponId,
    Guid UserId,
    string? Description,
    decimal? DiscountValue,
    decimal? MinOrderAmount,
    decimal? MaxDiscountAmount,
    int? UsageLimit,
    int? PerUserLimit,
    DateTime? ExpiresAt)
    : IRequest<CouponDto>;