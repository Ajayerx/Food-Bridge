// UpdateTaskStatusCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Delivery.Commands.UpdateTaskStatus;

public class UpdateTaskStatusCommandValidator
    : AbstractValidator<UpdateTaskStatusCommand>
{
    private static readonly string[] ValidStatuses =
    {
        "PickedUp", "Delivered", "Failed"
    };

    public UpdateTaskStatusCommandValidator()
    {
        RuleFor(x => x.Status)
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage(
                $"Invalid status. Valid: {string.Join(", ", ValidStatuses)}");
    }
}