// ValidateCouponCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Coupons.Commands.ValidateCoupon;

public class ValidateCouponCommandValidator
    : AbstractValidator<ValidateCouponCommand>
{
    public ValidateCouponCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .WithMessage("Coupon code is required.");

        RuleFor(x => x.OrderAmount)
            .GreaterThan(0)
            .WithMessage("Order amount must be greater than 0.");
    }
}