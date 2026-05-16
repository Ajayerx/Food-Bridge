using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reviews;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reviews.Queries.GetOrderReview;

public class GetOrderReviewQueryHandler : IRequestHandler<GetOrderReviewQuery, ReviewDto?>
{
    private readonly IAppDbContext _db;
    public GetOrderReviewQueryHandler(IAppDbContext db) => _db = db;

    public async Task<ReviewDto?> Handle(GetOrderReviewQuery request, CancellationToken ct)
    {
        var customer = await _db.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == request.UserId, ct);

        if (customer is null) return null;

        var review = await _db.Reviews
            .AsNoTracking()
            .Include(r => r.Customer).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(r =>
                r.OrderId == request.OrderId &&
                r.CustomerId == customer.Id, ct);

        if (review is null) return null;

        return new ReviewDto
        {
            Id = review.Id,
            CustomerId = review.CustomerId,
            CustomerName = review.Customer.User.FullName ?? string.Empty,
            CustomerAvatar = review.Customer.User.AvatarUrl,
            RestaurantId = review.RestaurantId,
            MenuItemId = review.MenuItemId,
            OrderId = review.OrderId,
            Rating = review.Rating,
            Comment = review.Comment,
            ImageUrls = string.IsNullOrEmpty(review.ImageUrls)
                ? new List<string>()
                : System.Text.Json.JsonSerializer.Deserialize<List<string>>(review.ImageUrls) ?? new(),
            VendorReply = review.VendorReply,
            RepliedAt = review.RepliedAt,
            CreatedAt = review.CreatedAt
        };
    }
}
