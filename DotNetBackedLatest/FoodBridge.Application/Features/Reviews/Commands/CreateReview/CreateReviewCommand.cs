// CreateReviewCommand.cs
using FoodBridge.Application.DTOs.Reviews;
using MediatR;
namespace FoodBridge.Application.Features.Reviews.Commands.CreateReview;

public record CreateReviewCommand(
    Guid UserId,
    Guid OrderId,
    Guid RestaurantId,
    Guid? MenuItemId,
    int Rating,
    string? Comment,
    List<string> ImageUrls)
    : IRequest<ReviewDto>;