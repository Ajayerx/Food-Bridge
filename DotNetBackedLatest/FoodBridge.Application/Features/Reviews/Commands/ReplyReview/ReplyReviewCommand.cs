// ReplyReviewCommand.cs
using FoodBridge.Application.DTOs.Reviews;
using MediatR;
namespace FoodBridge.Application.Features.Reviews.Commands.ReplyReview;

public record ReplyReviewCommand(
    Guid ReviewId,
    Guid VendorUserId,
    string Reply)
    : IRequest<ReviewDto>;