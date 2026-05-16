// GetReviewsQuery.cs
using FoodBridge.Application.DTOs.Reviews;
using MediatR;
namespace FoodBridge.Application.Features.Reviews.Queries.GetReviews;

public record GetReviewsQuery(
    Guid? RestaurantId,
    Guid? MenuItemId,
    int Page,
    int PageSize)
    : IRequest<List<ReviewDto>>;