// CreateStaffCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Staff.Commands.CreateStaff;

public class CreateStaffCommandValidator
    : AbstractValidator<CreateStaffCommand>
{
    public CreateStaffCommandValidator()
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

        RuleFor(x => x.StaffRole)
            .Must(r => new[] { "Manager", "Kitchen", "Cashier" ,"Waiter" }
                .Contains(r))
            .WithMessage("Invalid staff role.");
    }
}