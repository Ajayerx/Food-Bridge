// ValidateCouponCommand.cs
using FoodBridge.Application.DTOs.Coupons;
using MediatR;
namespace FoodBridge.Application.Features.Coupons.Commands.ValidateCoupon;

public record ValidateCouponCommand(
    string Code,
    Guid RestaurantId,
    decimal OrderAmount,
    Guid UserId)
    : IRequest<ValidateCouponResponseDto>;