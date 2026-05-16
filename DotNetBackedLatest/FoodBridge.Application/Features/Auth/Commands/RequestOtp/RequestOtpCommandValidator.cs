// RequestOtpCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Auth.Commands.RequestOtp;

public class RequestOtpCommandValidator
    : AbstractValidator<RequestOtpCommand>
{
    public RequestOtpCommandValidator()
    {
        RuleFor(x => x.MobileNumber)
            .NotEmpty()
            .WithMessage("Mobile number is required.")
            .Matches(@"^[6-9]\d{9}$")
            .WithMessage("Enter a valid 10-digit mobile number.");
    }
}