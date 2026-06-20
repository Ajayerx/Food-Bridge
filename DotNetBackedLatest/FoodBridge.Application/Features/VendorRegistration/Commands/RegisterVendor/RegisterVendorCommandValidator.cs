using FluentValidation;

namespace FoodBridge.Application.Features.VendorRegistration.Commands.RegisterVendor;

public class RegisterVendorCommandValidator
    : AbstractValidator<RegisterVendorCommand>
{
    public RegisterVendorCommandValidator()
    {
        // ── Account (Step 1) ─────────────────────────────────────────────
        RuleFor(x => x.MobileNumber)
            .NotEmpty().WithMessage("Mobile number is required.")
            .Matches(@"^[6-9]\d{9}$").WithMessage("Enter a valid 10-digit Indian mobile number.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100).WithMessage("Full name must not exceed 100 characters.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Enter a valid email address.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        // ── Business (Step 2) ────────────────────────────────────────────
        RuleFor(x => x.BusinessName)
            .NotEmpty().WithMessage("Business name is required.")
            .MaximumLength(200).WithMessage("Business name must not exceed 200 characters.");

        RuleFor(x => x.GstNumber)
            .Matches(@"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
            .WithMessage("Enter a valid 15-character GSTIN.")
            .When(x => !string.IsNullOrWhiteSpace(x.GstNumber));

        RuleFor(x => x.PanNumber)
            .Matches(@"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
            .WithMessage("Enter a valid 10-character PAN number.")
            .When(x => !string.IsNullOrWhiteSpace(x.PanNumber));

        RuleFor(x => x.BankIfscCode)
            .Matches(@"^[A-Z]{4}0[A-Z0-9]{6}$")
            .WithMessage("Enter a valid IFSC code.")
            .When(x => !string.IsNullOrWhiteSpace(x.BankIfscCode));

        RuleFor(x => x.BankAccountNumber)
            .MaximumLength(30).WithMessage("Bank account number must not exceed 30 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.BankAccountNumber));

        RuleFor(x => x.BankHolderName)
            .MaximumLength(200).WithMessage("Bank holder name must not exceed 200 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.BankHolderName));

        // ── Restaurant (Step 3) ──────────────────────────────────────────
        RuleFor(x => x.RestaurantName)
            .NotEmpty().WithMessage("Restaurant name is required.")
            .MaximumLength(150).WithMessage("Restaurant name must not exceed 150 characters.");

        RuleFor(x => x.Cuisines)
            .NotEmpty().WithMessage("Select at least one cuisine.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Address is required.")
            .MaximumLength(300).WithMessage("Address must not exceed 300 characters.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.");

        RuleFor(x => x.State)
            .NotEmpty().WithMessage("State is required.")
            .MaximumLength(100).WithMessage("State must not exceed 100 characters.");

        RuleFor(x => x.PinCode)
            .NotEmpty().WithMessage("PIN code is required.")
            .Matches(@"^[1-9][0-9]{5}$").WithMessage("Enter a valid 6-digit Indian PIN code.");

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^[6-9]\d{9}$").WithMessage("Enter a valid 10-digit contact number.")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(x => x.DeliveryFee)
            .GreaterThanOrEqualTo(0).WithMessage("Delivery fee must be 0 or greater.")
            .LessThanOrEqualTo(500).WithMessage("Delivery fee must not exceed 500.");

        RuleFor(x => x.MinOrderAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Minimum order value must be 0 or greater.");

        RuleFor(x => x.AvgPrepMinutes)
            .InclusiveBetween(1, 480).WithMessage("Average prep time must be between 1 and 480 minutes.");

        RuleFor(x => x.FssaiLicense)
            .MaximumLength(20).WithMessage("FSSAI license must not exceed 20 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.FssaiLicense));
    }
}
