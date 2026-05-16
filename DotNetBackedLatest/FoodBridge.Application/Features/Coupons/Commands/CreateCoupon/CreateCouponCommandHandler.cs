// CreateCouponCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Coupons;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Coupons.Commands.CreateCoupon;

public class CreateCouponCommandHandler
    : IRequestHandler<CreateCouponCommand, CouponDto>
{
    private readonly IAppDbContext _db;

    public CreateCouponCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<CouponDto> Handle(
        CreateCouponCommand request,
        CancellationToken ct)
    {
        // 1. Check duplicate code
        var exists = await _db.Coupons
            .AnyAsync(c => c.Code == request.Code.ToUpper(), ct);

        if (exists)
            throw new BadRequestException(
                $"Coupon code '{request.Code}' already exists.");

        // 2. Create coupon
        var coupon = new Coupon
        {
            Code = request.Code.ToUpper(),
            Description = request.Description,
            CouponType = Enum.Parse<CouponType>(request.CouponType),
            DiscountValue = request.DiscountValue,
            MinOrderAmount = request.MinOrderAmount,
            MaxDiscountAmount = request.MaxDiscountAmount,
            UsageLimit = request.UsageLimit,
            PerUserLimit = request.PerUserLimit,
            RestaurantId = request.RestaurantId,
            Status = CouponStatus.Active,
            UsageCount = 0,
            ExpiresAt = request.ExpiresAt
        };

        _db.Coupons.Add(coupon);
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