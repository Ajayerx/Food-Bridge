// CreateTableCommandValidator.cs
using FluentValidation;

namespace FoodBridge.Application.Features.Restaurants.Commands.CreateTable;

public class CreateTableCommandValidator : AbstractValidator<CreateTableCommand>
{
    public CreateTableCommandValidator()
    {
        RuleFor(x => x.TableNumber)
            .NotEmpty().WithMessage("Table number is required.")
            .MaximumLength(20).WithMessage("Table number must not exceed 20 characters.");

        RuleFor(x => x.Capacity)
            .GreaterThan(0).WithMessage("Capacity must be greater than zero.")
            .LessThanOrEqualTo(100).WithMessage("Capacity must not exceed 100.");

        RuleFor(x => x.RestaurantId)
            .NotEmpty().WithMessage("Restaurant ID is required.");
    }
}