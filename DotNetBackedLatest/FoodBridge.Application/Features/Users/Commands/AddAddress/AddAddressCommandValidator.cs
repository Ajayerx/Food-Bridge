// AddAddressCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Users.Commands.AddAddress;

public class AddAddressCommandValidator
    : AbstractValidator<AddAddressCommand>
{
    public AddAddressCommandValidator()
    {
        RuleFor(x => x.Label)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.AddressLine1)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.City)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.State)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.PinCode)
            .NotEmpty()
            .Matches(@"^\d{6}$")
            .WithMessage("Enter a valid 6-digit PIN code.");
    }
}