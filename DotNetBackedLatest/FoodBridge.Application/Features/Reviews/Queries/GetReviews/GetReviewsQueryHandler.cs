// GetReviewsQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reviews;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reviews.Queries.GetReviews;

public class GetReviewsQueryHandler
    : IRequestHandler<GetReviewsQuery, List<ReviewDto>>
{
    private readonly IAppDbContext _db;

    public GetReviewsQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<ReviewDto>> Handle(
        GetReviewsQuery request,
        CancellationToken ct)
    {
        var query = _db.Reviews
            .AsNoTracking()
            .Include(r => r.Customer)
                .ThenInclude(c => c.User)
            .AsQueryable();

        if (request.RestaurantId.HasValue)
            query = query.Where(
                r => r.RestaurantId == request.RestaurantId);

        if (request.MenuItemId.HasValue)
            query = query.Where(
                r => r.MenuItemId == request.MenuItemId);

        var reviews = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return reviews.Select(r => new ReviewDto
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
            ImageUrls = r.ImageUrls?
                .Split(",", StringSplitOptions.RemoveEmptyEntries)
                .ToList() ?? new(),
            VendorReply = r.VendorReply,
            RepliedAt = r.RepliedAt,
            CreatedAt = r.CreatedAt
        }).ToList();
    }
}