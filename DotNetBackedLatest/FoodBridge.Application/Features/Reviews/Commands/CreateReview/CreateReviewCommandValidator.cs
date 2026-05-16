// CreateReviewCommandValidator.cs
using FluentValidation;
namespace FoodBridge.Application.Features.Reviews.Commands.CreateReview;

public class CreateReviewCommandValidator
    : AbstractValidator<CreateReviewCommand>
{
    public CreateReviewCommandValidator()
    {
        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5)
            .WithMessage("Rating must be between 1 and 5.");

        RuleFor(x => x.Comment)
            .MaximumLength(500)
            .When(x => x.Comment is not null)
            .WithMessage("Comment must be under 500 characters.");

        RuleFor(x => x.ImageUrls)
            .Must(urls => urls.Count <= 5)
            .WithMessage("Maximum 5 images allowed per review.");
    }
}