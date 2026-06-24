using FluentValidation;

namespace FoodBridge.Application.Features.Admin.Queries.GetDashboardStats;

public class GetDashboardStatsQueryValidator
    : AbstractValidator<GetDashboardStatsQuery>
{
    public GetDashboardStatsQueryValidator()
    {
        RuleFor(x => x.From)
            .NotEmpty()
            .WithMessage("'from' date is required");

        RuleFor(x => x.To)
            .NotEmpty()
            .WithMessage("'to' date is required");

        RuleFor(x => x)
            .Must(x => x.From < x.To)
            .WithMessage("'from' must be earlier than 'to'")
            .Must(x => (x.To - x.From).Days <= 366)
            .WithMessage("Date range cannot exceed 366 days")
            .Must(x => x.To <= DateTime.UtcNow)
            .WithMessage("'to' date cannot be in the future");
    }
}
