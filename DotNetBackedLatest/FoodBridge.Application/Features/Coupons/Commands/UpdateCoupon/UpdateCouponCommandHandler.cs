// UpdateCouponCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Coupons;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Coupons.Commands.UpdateCoupon;

public class UpdateCouponCommandHandler
    : IRequestHandler<UpdateCouponCommand, CouponDto>
{
    private readonly IAppDbContext _db;

    public UpdateCouponCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<CouponDto> Handle(
        UpdateCouponCommand request,
        CancellationToken ct)
    {
        var coupon = await _db.Coupons
            .FirstOrDefaultAsync(
                c => c.Id == request.CouponId, ct)
            ?? throw new NotFoundException(
                "Coupon", request.CouponId);

        if (request.Description is not null)
            coupon.Description = request.Description;
        if (request.DiscountValue is not null)
            coupon.DiscountValue = request.DiscountValue.Value;
        if (request.MinOrderAmount is not null)
            coupon.MinOrderAmount = request.MinOrderAmount.Value;
        if (request.MaxDiscountAmount is not null)
            coupon.MaxDiscountAmount = request.MaxDiscountAmount;
        if (request.UsageLimit is not null)
            coupon.UsageLimit = request.UsageLimit;
        if (request.PerUserLimit is not null)
            coupon.PerUserLimit = request.PerUserLimit;
        if (request.ExpiresAt is not null)
            coupon.ExpiresAt = request.ExpiresAt;

        coupon.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return new CouponDto
        {
            Id = coupon.Id,
            Code = coupon.Code,
            Description = coupon.Description,
            CouponType = coupon.CouponType.ToString(),
            DiscountValue = coupon.DiscountValue,
            MinOrderAmount = coupon.MinOrderAmount,
            MaxDiscountAmount = coupon.MaxDiscountAmount,
            UsageLimit = coupon.UsageLimit,
            UsageCount = coupon.UsageCount,
            PerUserLimit = coupon.PerUserLimit,
            RestaurantId = coupon.RestaurantId,
            Status = coupon.Status.ToString(),
            ExpiresAt = coupon.ExpiresAt,
            CreatedAt = coupon.CreatedAt
        };
    }
}