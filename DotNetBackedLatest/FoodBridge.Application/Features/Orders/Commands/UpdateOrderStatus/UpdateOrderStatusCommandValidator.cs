// UpdateOrderStatusCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Orders.Commands.UpdateOrderStatus;

public class UpdateOrderStatusCommandValidator
    : AbstractValidator<UpdateOrderStatusCommand>
{
    private static readonly string[] ValidStatuses =
    {
        "Confirmed", "Preparing", "ReadyForPickup",
        "OutForDelivery", "Delivered","Completed",  "Cancelled"
    };

    public UpdateOrderStatusCommandValidator()
    {
        RuleFor(x => x.Status)
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage($"Invalid status. Valid: {string.Join(", ", ValidStatuses)}");
    }
}