// GetCouponsQuery.cs
using FoodBridge.Application.DTOs.Coupons;
using MediatR;
namespace FoodBridge.Application.Features.Coupons.Queries.GetCoupons;

public record GetCouponsQuery(
    Guid? RestaurantId,
    bool ActiveOnly,
    int Page,
    int PageSize)
    : IRequest<List<CouponDto>>;