// CreateOrderCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Orders.Commands.CreateOrder;

public class CreateOrderCommandValidator
    : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.RestaurantId)
            .NotEmpty();

        RuleFor(x => x.OrderType)
            .Must(t => new[] { "Delivery", "Takeaway", "DineIn" }
                .Contains(t))
            .WithMessage("Invalid order type.");

        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("Order must have at least one item.");

        RuleFor(x => x.PaymentMethod)
            .Must(m => new[] { "Online", "COD" }.Contains(m))
            .WithMessage("Invalid payment method.")
            .When(x => x.OrderType == "Delivery");

        RuleFor(x => x.DeliveryAddressId)
            .NotNull()
            .When(x => x.OrderType == "Delivery")
            .WithMessage("Delivery address is required for delivery orders.");

        RuleFor(x => x.TableId)
            .NotNull()
            .When(x => x.OrderType == "DineIn")
            .WithMessage("Table is required for dine-in orders.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.MenuItemId)
                .NotEmpty();

            item.RuleFor(i => i.Quantity)
                .GreaterThan(0)
                .LessThanOrEqualTo(99);
        });
    }
}