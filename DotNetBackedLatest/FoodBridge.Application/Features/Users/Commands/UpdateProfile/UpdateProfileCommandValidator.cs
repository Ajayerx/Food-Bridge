// UpdateProfileCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Users.Commands.UpdateProfile;

public class UpdateProfileCommandValidator
    : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("Enter a valid email address.");

        RuleFor(x => x.FullName)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.FullName))
            .WithMessage("Name must be under 100 characters.");
    }
}