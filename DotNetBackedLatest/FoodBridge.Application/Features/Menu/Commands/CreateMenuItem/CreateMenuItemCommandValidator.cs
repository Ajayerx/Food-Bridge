// CreateMenuItemCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Menu.Commands.CreateMenuItem;

public class CreateMenuItemCommandValidator
    : AbstractValidator<CreateMenuItemCommand>
{
    public CreateMenuItemCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(150);

        RuleFor(x => x.BasePrice)
            .GreaterThan(0)
            .WithMessage("Price must be greater than 0.");

        RuleFor(x => x.PrepTimeMinutes)
            .InclusiveBetween(1, 120)
            .WithMessage("Prep time must be between 1 and 120 minutes.");

        RuleFor(x => x.DietaryTag)
            .Must(t => new[] { "Veg", "NonVeg", "Vegan", "Egg" }.Contains(t))
            .WithMessage("Invalid dietary tag.");
    }
}