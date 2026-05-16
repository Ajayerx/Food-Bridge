// CreateRazorpayOrderCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Payments.Commands.CreateRazorpayOrder;

public class CreateRazorpayOrderCommandValidator
    : AbstractValidator<CreateRazorpayOrderCommand>
{
    public CreateRazorpayOrderCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("Order ID is required.");
    }
}