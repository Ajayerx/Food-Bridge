// GetCouponsQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Coupons;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Coupons.Queries.GetCoupons;

public class GetCouponsQueryHandler
    : IRequestHandler<GetCouponsQuery, List<CouponDto>>
{
    private readonly IAppDbContext _db;

    public GetCouponsQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<CouponDto>> Handle(
    GetCouponsQuery request,
    CancellationToken ct)
    {
        // ── DEBUG: log all coupons raw ──
        var all = await _db.Coupons.AsNoTracking().ToListAsync(ct);
        foreach (var c in all)
        {
            Console.WriteLine($"[COUPON] Code={c.Code} Status={c.Status} RestaurantId={c.RestaurantId} ExpiresAt={c.ExpiresAt} UtcNow={DateTime.UtcNow}");
        }
        // ── END DEBUG ──

        var query = _db.Coupons
            .AsNoTracking()
            .Include(c => c.Restaurant)
            .AsQueryable();

        if (request.ActiveOnly)
            query = query.Where(
                c => c.Status == CouponStatus.Active
                  && (c.ExpiresAt == null
                   || c.ExpiresAt > DateTime.UtcNow));

        if (request.RestaurantId.HasValue)
            query = query.Where(
                c => c.RestaurantId == null
                  || c.RestaurantId == request.RestaurantId);

        var coupons = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return coupons.Select(c => new CouponDto
        {
            Id = c.Id,
            Code = c.Code,
            Description = c.Description,
            CouponType = c.CouponType.ToString(),
            DiscountValue = c.DiscountValue,
            MinOrderAmount = c.MinOrderAmount,
            MaxDiscountAmount = c.MaxDiscountAmount,
            UsageLimit = c.UsageLimit,
            UsageCount = c.UsageCount,
            PerUserLimit = c.PerUserLimit,
            RestaurantId = c.RestaurantId,
            RestaurantName = c.Restaurant?.Name,
            Status = c.Status.ToString(),
            ExpiresAt = c.ExpiresAt,
            CreatedAt = c.CreatedAt
        }).ToList();
    }
}