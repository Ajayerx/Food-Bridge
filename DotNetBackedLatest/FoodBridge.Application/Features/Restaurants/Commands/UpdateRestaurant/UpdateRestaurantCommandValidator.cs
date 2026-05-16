// UpdateRestaurantCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Restaurants.Commands.UpdateRestaurant;

public class UpdateRestaurantCommandValidator
    : AbstractValidator<UpdateRestaurantCommand>
{
    public UpdateRestaurantCommandValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(150)
            .When(x => x.Name is not null);

        RuleFor(x => x.PinCode)
            .Matches(@"^\d{6}$")
            .When(x => x.PinCode is not null)
            .WithMessage("Enter a valid 6-digit PIN code.");

        RuleFor(x => x.DeliveryFee)
            .GreaterThanOrEqualTo(0)
            .When(x => x.DeliveryFee.HasValue);

        RuleFor(x => x.AvgDeliveryMinutes)
            .InclusiveBetween(5, 120)
            .When(x => x.AvgDeliveryMinutes.HasValue);
    }
}