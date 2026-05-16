// CreateReviewCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reviews;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reviews.Commands.CreateReview;

public class CreateReviewCommandHandler
    : IRequestHandler<CreateReviewCommand, ReviewDto>
{
    private readonly IAppDbContext _db;

    public CreateReviewCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<ReviewDto> Handle(
        CreateReviewCommand request,
        CancellationToken ct)
    {
        // 1. Get customer
        var customer = await _db.Customers
            .Include(c => c.User)
            .FirstOrDefaultAsync(
                c => c.UserId == request.UserId, ct)
            ?? throw new NotFoundException(
                "Customer profile not found.");

        // 2. Verify order belongs to customer
        //    and is delivered
        var order = await _db.Orders
            .FirstOrDefaultAsync(
                o => o.Id == request.OrderId
                  && o.CustomerId == customer.Id
                  && o.OrderStatus == OrderStatus.Delivered, ct)
            ?? throw new BadRequestException(
                "You can only review delivered orders.");

        // 3. Check no duplicate review
        var alreadyReviewed = await _db.Reviews
            .AnyAsync(
                r => r.OrderId == request.OrderId
                  && r.CustomerId == customer.Id
                  && r.RestaurantId == request.RestaurantId
                  && (request.MenuItemId == null
                   || r.MenuItemId == request.MenuItemId), ct);

        if (alreadyReviewed)
            throw new BadRequestException(
                "You have already reviewed this order.");

        // 4. Create review
        var review = new Review
        {
            CustomerId = customer.Id,
            OrderId = request.OrderId,
            RestaurantId = request.RestaurantId,
            MenuItemId = request.MenuItemId,
            Rating = request.Rating,
            Comment = request.Comment,
            ImageUrls = string.Join(",", request.ImageUrls)
        };

        _db.Reviews.Add(review);

        // 5. Update restaurant avg rating
        var restaurant = await _db.Restaurants
            .FirstOrDefaultAsync(
                r => r.Id == request.RestaurantId, ct);

        if (restaurant is not null)
        {
            var totalRatings = restaurant.TotalRatings + 1;
            var avgRating = ((restaurant.AvgRating ?? 0)
                               * restaurant.TotalRatings
                               + request.Rating) / totalRatings;

            restaurant.AvgRating = Math.Round(avgRating, 1);
            restaurant.TotalRatings = totalRatings;
            restaurant.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        return new ReviewDto
        {
            Id = review.Id,
            CustomerId = customer.Id,
            CustomerName = customer.User.FullName ?? string.Empty,
            RestaurantId = review.RestaurantId,
            MenuItemId = review.MenuItemId,
            OrderId = review.OrderId,
            Rating = review.Rating,
            Comment = review.Comment,
            ImageUrls = review.ImageUrls?
                .Split(",", StringSplitOptions.RemoveEmptyEntries)
                .ToList() ?? new(),
            CreatedAt = review.CreatedAt
        };
    }
}