// CreateModifierGroupCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Menu.Commands.CreateModifierGroup;

public class CreateModifierGroupCommandValidator
    : AbstractValidator<CreateModifierGroupCommand>
{
    public CreateModifierGroupCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.MaxSelections)
            .GreaterThan(0)
            .WithMessage("Max selections must be at least 1.");
    }
}