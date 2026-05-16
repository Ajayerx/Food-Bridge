// DeleteReviewCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Reviews.Commands.DeleteReview;

public record DeleteReviewCommand(
    Guid ReviewId,
    Guid UserId,
    string? RoleType)
    : IRequest<Unit>;