// CreateTicketCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Support.Commands.CreateTicket;

public class CreateTicketCommandValidator
    : AbstractValidator<CreateTicketCommand>
{
    public CreateTicketCommandValidator()
    {
        RuleFor(x => x.Subject)
            .NotEmpty()
            .MaximumLength(200)
            .WithMessage("Subject is required.");

        RuleFor(x => x.Message)
            .NotEmpty()
            .MaximumLength(1000)
            .WithMessage("Message is required.");
    }
}