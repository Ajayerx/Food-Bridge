// CreateAgentCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Agents.Commands.CreateAgent;

public class CreateAgentCommandValidator
    : AbstractValidator<CreateAgentCommand>
{
    public CreateAgentCommandValidator()
    {
        RuleFor(x => x.MobileNumber)
            .NotEmpty()
            .Matches(@"^[6-9]\d{9}$")
            .WithMessage("Enter a valid 10-digit mobile number.");

        RuleFor(x => x.FullName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.VehicleType)
            .Must(t => new[]
            {
                "Bicycle","Motorcycle","Scooter",
                "Car","Van","OnFoot"
            }.Contains(t))
            .When(x => x.VehicleType is not null)
            .WithMessage("Invalid vehicle type.");
    }
}