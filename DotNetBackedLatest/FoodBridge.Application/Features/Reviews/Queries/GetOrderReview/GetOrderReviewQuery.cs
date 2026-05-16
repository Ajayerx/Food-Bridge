using FoodBridge.Application.DTOs.Reviews;
using MediatR;
namespace FoodBridge.Application.Features.Reviews.Queries.GetOrderReview;

public record GetOrderReviewQuery(Guid OrderId, Guid UserId) : IRequest<ReviewDto?>;
