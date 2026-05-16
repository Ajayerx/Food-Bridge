// VerifyOtpCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Auth.Commands.VerifyOtp;

public class VerifyOtpCommandValidator
    : AbstractValidator<VerifyOtpCommand>
{
    public VerifyOtpCommandValidator()
    {
        RuleFor(x => x.MobileNumber)
            .NotEmpty()
            .Matches(@"^[6-9]\d{9}$")
            .WithMessage("Enter a valid 10-digit mobile number.");

        RuleFor(x => x.Otp)
            .NotEmpty()
            .WithMessage("OTP is required.")
            .Length(6)
            .WithMessage("OTP must be 6 digits.")
            .Matches(@"^\d{6}$")
            .WithMessage("OTP must be numeric.");
    }
}