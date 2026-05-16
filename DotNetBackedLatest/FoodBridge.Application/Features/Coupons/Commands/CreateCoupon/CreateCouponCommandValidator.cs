// CreateCouponCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Coupons.Commands.CreateCoupon;

public class CreateCouponCommandValidator
    : AbstractValidator<CreateCouponCommand>
{
    public CreateCouponCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .MaximumLength(20)
            .Matches(@"^[A-Z0-9]+$")
            .WithMessage("Coupon code must be uppercase letters and numbers only.");

        RuleFor(x => x.CouponType)
            .Must(t => new[] { "Percentage", "Flat" }.Contains(t))
            .WithMessage("Coupon type must be Percentage or Flat.");

        RuleFor(x => x.DiscountValue)
            .GreaterThan(0)
            .WithMessage("Discount value must be greater than 0.");

        RuleFor(x => x.DiscountValue)
            .LessThanOrEqualTo(100)
            .When(x => x.CouponType == "Percentage")
            .WithMessage("Percentage discount cannot exceed 100%.");

        RuleFor(x => x.MinOrderAmount)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.ExpiresAt)
            .GreaterThan(DateTime.UtcNow)
            .When(x => x.ExpiresAt.HasValue)
            .WithMessage("Expiry date must be in the future.");
    }
}