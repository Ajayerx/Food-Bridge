// DeleteCouponCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Coupons.Commands.DeleteCoupon;

public record DeleteCouponCommand(
    Guid CouponId,
    Guid UserId)
    : IRequest<Unit>;