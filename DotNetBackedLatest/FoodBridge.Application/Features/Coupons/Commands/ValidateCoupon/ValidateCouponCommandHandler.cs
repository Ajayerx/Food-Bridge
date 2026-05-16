// ValidateCouponCommandHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Coupons;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Coupons.Commands.ValidateCoupon;

public class ValidateCouponCommandHandler
    : IRequestHandler<ValidateCouponCommand, ValidateCouponResponseDto>
{
    private readonly IAppDbContext _db;

    public ValidateCouponCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<ValidateCouponResponseDto> Handle(
        ValidateCouponCommand request,
        CancellationToken ct)
    {
        // 1. Find coupon
        var coupon = await _db.Coupons
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.Code == request.Code.ToUpper()
                  && c.Status == CouponStatus.Active, ct);

        if (coupon is null)
            return new ValidateCouponResponseDto
            {
                IsValid = false,
                Message = "Coupon not found or has expired.",
                CouponCode = request.Code
            };

        // 2. Check expiry
        if (coupon.ExpiresAt.HasValue
         && coupon.ExpiresAt < DateTime.UtcNow)
            return new ValidateCouponResponseDto
            {
                IsValid = false,
                Message = "Coupon has expired.",
                CouponCode = request.Code
            };

        // 3. Check restaurant restriction
        if (coupon.RestaurantId.HasValue
         && coupon.RestaurantId != request.RestaurantId)
            return new ValidateCouponResponseDto
            {
                IsValid = false,
                Message = "Coupon is not valid for this restaurant.",
                CouponCode = request.Code
            };

        // 4. Check min order amount
        if (request.OrderAmount < coupon.MinOrderAmount)
            return new ValidateCouponResponseDto
            {
                IsValid = false,
                Message = $"Minimum order amount of ₹{coupon.MinOrderAmount} required.",
                CouponCode = request.Code
            };

        // 5. Check global usage limit
        if (coupon.UsageLimit.HasValue
         && coupon.UsageCount >= coupon.UsageLimit)
            return new ValidateCouponResponseDto
            {
                IsValid = false,
                Message = "Coupon usage limit has been reached.",
                CouponCode = request.Code
            };

        // 6. Check per-user limit
        if (coupon.PerUserLimit.HasValue)
        {
            var customer = await _db.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    c => c.UserId == request.UserId, ct);

            if (customer is not null)
            {
                var userUsageCount = await _db.CouponRedemptions
                    .CountAsync(
                        r => r.CouponId == coupon.Id
                          && r.CustomerId == customer.Id, ct);

                if (userUsageCount >= coupon.PerUserLimit)
                    return new ValidateCouponResponseDto
                    {
                        IsValid = false,
                        Message = "You have already used this coupon the maximum number of times.",
                        CouponCode = request.Code
                    };
            }
        }

        // 7. Calculate discount amount
        decimal discountAmount = coupon.CouponType == CouponType.Percentage
            ? Math.Min(
                Math.Round(request.OrderAmount * coupon.DiscountValue / 100, 2),
                coupon.MaxDiscountAmount ?? decimal.MaxValue)
            : Math.Min(coupon.DiscountValue, request.OrderAmount);

        var finalAmount = request.OrderAmount - discountAmount;

        return new ValidateCouponResponseDto
        {
            IsValid = true,
            Message = "Coupon applied successfully.",
            DiscountAmount = discountAmount,
            FinalAmount = finalAmount,
            CouponCode = coupon.Code
        };
    }
}