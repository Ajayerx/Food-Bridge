// CreateMenuCategoryCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Menu.Commands.CreateMenuCategory;

public class CreateMenuCategoryCommandValidator
    : AbstractValidator<CreateMenuCategoryCommand>
{
    public CreateMenuCategoryCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100)
            .WithMessage("Category name is required.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0);
    }
}