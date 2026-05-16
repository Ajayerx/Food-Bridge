// DeleteReviewCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reviews.Commands.DeleteReview;

public class DeleteReviewCommandHandler
    : IRequestHandler<DeleteReviewCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteReviewCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        DeleteReviewCommand request,
        CancellationToken ct)
    {
        var review = await _db.Reviews
            .Include(r => r.Customer)
            .FirstOrDefaultAsync(
                r => r.Id == request.ReviewId, ct)
            ?? throw new NotFoundException(
                "Review", request.ReviewId);

        // Customer can only delete own review
        // Admin can delete any review
        if (request.RoleType != "Admin"
         && review.Customer.UserId != request.UserId)
            throw new ForbiddenException(
                "You are not allowed to delete this review.");

        // Update restaurant avg rating
        var restaurant = await _db.Restaurants
            .FirstOrDefaultAsync(
                r => r.Id == review.RestaurantId, ct);

        if (restaurant is not null
         && restaurant.TotalRatings > 1)
        {
            var newTotal = restaurant.TotalRatings - 1;
            var newAvg = ((restaurant.AvgRating ?? 0)
                            * restaurant.TotalRatings
                            - review.Rating) / newTotal;

            restaurant.AvgRating = Math.Round(newAvg, 1);
            restaurant.TotalRatings = newTotal;
            restaurant.UpdatedAt = DateTime.UtcNow;
        }
        else if (restaurant is not null)
        {
            restaurant.AvgRating = null;
            restaurant.TotalRatings = 0;
            restaurant.UpdatedAt = DateTime.UtcNow;
        }

        _db.Reviews.Remove(review);
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}