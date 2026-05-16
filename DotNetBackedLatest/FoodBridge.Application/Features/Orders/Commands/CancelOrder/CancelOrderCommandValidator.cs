// CancelOrderCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Orders.Commands.CancelOrder;

public class CancelOrderCommandValidator
    : AbstractValidator<CancelOrderCommand>
{
    public CancelOrderCommandValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("Cancellation reason is required.")
            .MaximumLength(300);
    }
}