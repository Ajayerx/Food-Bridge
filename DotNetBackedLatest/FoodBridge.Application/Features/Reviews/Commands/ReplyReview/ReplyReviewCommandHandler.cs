using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Reviews;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Reviews.Commands.ReplyReview;

public class ReplyReviewCommandHandler
    : IRequestHandler<ReplyReviewCommand, ReviewDto>
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notifications;

    public ReplyReviewCommandHandler(
        IAppDbContext db,
        INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<ReviewDto> Handle(
        ReplyReviewCommand request,
        CancellationToken ct)
    {
        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(v => v.UserId == request.VendorUserId, ct)
            ?? throw new NotFoundException("Vendor profile not found.");

        var review = await _db.Reviews
            .Include(r => r.Customer).ThenInclude(c => c.User)
            .Include(r => r.Restaurant)
            .Include(r => r.Order)
            .FirstOrDefaultAsync(
                r => r.Id == request.ReviewId
                  && r.Restaurant.VendorId == vendor.Id, ct)
            ?? throw new NotFoundException("Review", request.ReviewId);

        if (review.VendorReply is not null)
            throw new BadRequestException("You have already replied to this review.");

        review.VendorReply = request.Reply;
        review.RepliedAt = DateTime.UtcNow;
        review.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        // Notify the customer who wrote the review
        var customerUserId = review.Customer.UserId;
        var restaurantName = review.Restaurant.Name;

        _ = await _notifications.SendToUserAsync(   // ✅ discards Guid return, Task<Guid> is still awaited
            customerUserId,
            "Restaurant replied to your review",
            $"{restaurantName} has responded to your review. Tap to see their reply.",
            new
            {
                reviewId = review.Id.ToString(),
                orderId = review.OrderId.ToString(),
                orderCode = review.Order!.OrderCode,
                restaurantName = restaurantName,
                replyText = request.Reply
            },
            NotificationType.NewReview,
            ct);

        return new ReviewDto
        {
            Id = review.Id,
            CustomerId = review.CustomerId,
            CustomerName = review.Customer.User.FullName ?? string.Empty,
            RestaurantId = review.RestaurantId,
            MenuItemId = review.MenuItemId,
            OrderId = review.OrderId,
            Rating = review.Rating,
            Comment = review.Comment,
            ImageUrls = review.ImageUrls?
                .Split(",", StringSplitOptions.RemoveEmptyEntries)
                .ToList() ?? new(),
            VendorReply = review.VendorReply,
            RepliedAt = review.RepliedAt,
            CreatedAt = review.CreatedAt
        };
    }
}