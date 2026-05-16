using FoodBridge.Application.DTOs.Reviews;
using MediatR;
namespace FoodBridge.Application.Features.Reviews.Queries.GetRestaurantReviews;

public record GetRestaurantReviewsQuery(Guid RestaurantId, int Page, int PageSize)
    : IRequest<GetRestaurantReviewsResult>;

public record GetRestaurantReviewsResult(List<ReviewDto> Items, int TotalCount);
