using MediatR;
namespace FoodBridge.Application.Features.Reviews.Commands.HideReview;

public record HideReviewCommand(Guid ReviewId) : IRequest<Unit>;
