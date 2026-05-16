// UpdateMenuItemCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Menu.Commands.UpdateMenuItem;

public class UpdateMenuItemCommandValidator
    : AbstractValidator<UpdateMenuItemCommand>
{
    public UpdateMenuItemCommandValidator()
    {
        RuleFor(x => x.BasePrice)
            .GreaterThan(0)
            .When(x => x.BasePrice.HasValue)
            .WithMessage("Price must be greater than 0.");

        RuleFor(x => x.PrepTimeMinutes)
            .InclusiveBetween(1, 120)
            .When(x => x.PrepTimeMinutes.HasValue);

        RuleFor(x => x.DietaryTag)
            .Must(t => new[] { "Veg", "NonVeg", "Vegan", "Egg" }.Contains(t))
            .When(x => x.DietaryTag is not null)
            .WithMessage("Invalid dietary tag.");
    }
}