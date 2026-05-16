// CreateRestaurantCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Restaurants.Commands.CreateRestaurant;

public class CreateRestaurantCommandValidator
    : AbstractValidator<CreateRestaurantCommand>
{
    public CreateRestaurantCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(150)
            .WithMessage("Restaurant name is required.");

        RuleFor(x => x.AddressLine)
            .NotEmpty()
            .MaximumLength(300);

        RuleFor(x => x.City)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.State)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.PinCode)
            .NotEmpty()
            .Matches(@"^\d{6}$")
            .WithMessage("Enter a valid 6-digit PIN code.");

        RuleFor(x => x.DeliveryFee)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.MinOrderAmount)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.AvgDeliveryMinutes)
            .InclusiveBetween(5, 120)
            .WithMessage("Delivery time must be between 5 and 120 minutes.");
    }
}