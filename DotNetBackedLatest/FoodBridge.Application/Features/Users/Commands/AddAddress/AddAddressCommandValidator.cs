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
            .WithMessage("Please enter or select an address label.")
            .MaximumLength(100);

        RuleFor(x => x.AddressLine1)
            .NotEmpty()
            .WithMessage("Street address is required.")
            .MaximumLength(255);

        RuleFor(x => x.City)
            .NotEmpty()
            .WithMessage("City is required.")
            .MaximumLength(100);

        RuleFor(x => x.State)
            .NotEmpty()
            .WithMessage("State is required.")
            .MaximumLength(100);

        RuleFor(x => x.PinCode)
            .NotEmpty()
            .WithMessage("PIN code is required.")
            .Matches(@"^[1-9][0-9]{5}$")
            .WithMessage("Please enter a valid 6-digit Indian PIN code.");

        RuleFor(x => x.Latitude)
            .NotNull()
            .WithMessage("Location coordinates are missing. Please use current location or search.")
            .InclusiveBetween(-90m, 90m)
            .WithMessage("Latitude must be between -90 and 90.")
            .Must(lat => lat != 0)
            .WithMessage("Location coordinates are missing. Please use current location or search.");

        RuleFor(x => x.Longitude)
            .NotNull()
            .WithMessage("Location coordinates are missing. Please use current location or search.")
            .InclusiveBetween(-180m, 180m)
            .WithMessage("Longitude must be between -180 and 180.")
            .Must(lon => lon != 0)
            .WithMessage("Location coordinates are missing. Please use current location or search.");
    }
}