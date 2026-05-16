// SendMessageCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Support.Commands.SendMessage;

public class SendMessageCommandValidator
    : AbstractValidator<SendMessageCommand>
{
    public SendMessageCommandValidator()
    {
        RuleFor(x => x.Message)
            .NotEmpty()
            .MaximumLength(1000)
            .WithMessage("Message is required.");
    }
}