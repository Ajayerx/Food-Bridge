using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reviews;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reviews.Queries.GetRestaurantReviews;

public class GetRestaurantReviewsQueryHandler
    : IRequestHandler<GetRestaurantReviewsQuery, GetRestaurantReviewsResult>
{
    private readonly IAppDbContext _db;
    public GetRestaurantReviewsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<GetRestaurantReviewsResult> Handle(
        GetRestaurantReviewsQuery request, CancellationToken ct)
    {
        var query = _db.Reviews
            .AsNoTracking()
            .Include(r => r.Customer).ThenInclude(c => c.User)
            .Where(r => r.RestaurantId == request.RestaurantId);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var dtos = items.Select(r => new ReviewDto
        {
            Id = r.Id,
            CustomerId = r.CustomerId,
            CustomerName = r.Customer.User.FullName ?? string.Empty,
            CustomerAvatar = r.Customer.User.AvatarUrl,
            RestaurantId = r.RestaurantId,
            MenuItemId = r.MenuItemId,
            OrderId = r.OrderId,
            Rating = r.Rating,
            Comment = r.Comment,
            ImageUrls = string.IsNullOrEmpty(r.ImageUrls)
                ? new List<string>()
                : System.Text.Json.JsonSerializer.Deserialize<List<string>>(r.ImageUrls) ?? new(),
            VendorReply = r.VendorReply,
            RepliedAt = r.RepliedAt,
            CreatedAt = r.CreatedAt
        }).ToList();

        return new GetRestaurantReviewsResult(dtos, total);
    }
}
