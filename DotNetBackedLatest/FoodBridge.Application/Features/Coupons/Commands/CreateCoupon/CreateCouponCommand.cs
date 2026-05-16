// CreateCouponCommand.cs
using FoodBridge.Application.DTOs.Coupons;
using MediatR;
namespace FoodBridge.Application.Features.Coupons.Commands.CreateCoupon;

public record CreateCouponCommand(
    Guid CreatedByUserId,
    string Code,
    string? Description,
    string CouponType,
    decimal DiscountValue,
    decimal MinOrderAmount,
    decimal? MaxDiscountAmount,
    int? UsageLimit,
    int? PerUserLimit,
    Guid? RestaurantId,
    DateTime? ExpiresAt)
    : IRequest<CouponDto>;