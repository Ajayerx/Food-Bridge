using FoodBridge.Application.DTOs.Reviews;
using FoodBridge.Application.Features.Reviews.Commands.CreateReview;
using FoodBridge.Application.Features.Reviews.Commands.ReplyReview;
using FoodBridge.Application.Features.Reviews.Commands.DeleteReview;
using FoodBridge.Application.Features.Reviews.Commands.HideReview;
using FoodBridge.Application.Features.Reviews.Queries.GetReviews;
using FoodBridge.Application.Features.Reviews.Queries.GetOrderReview;
using FoodBridge.Application.Features.Reviews.Queries.GetRestaurantReviews;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Authorize]
public class ReviewsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ReviewsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    // ── Public restaurant reviews ─────────────────────────────────────────────
    /// <summary>GET v1/reviews</summary>
    [HttpGet("v1/reviews")]
    [AllowAnonymous]
    public async Task<IActionResult> GetReviews(
        [FromQuery] Guid? restaurantId,
        [FromQuery] Guid? menuItemId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetReviewsQuery(restaurantId, menuItemId, page, pageSize), ct);
        return Ok(new { success = true, data = result });
    }

    // ── Per-order review (customer) ───────────────────────────────────────────
    /// <summary>POST v1/orders/{id}/review — Customer submits review after delivery</summary>
    [HttpPost("v1/orders/{id:guid}/review")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> CreateOrderReview(
        Guid id,
        [FromBody] CreateReviewRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateReviewCommand(
                _currentUser.UserId!.Value, id, dto.RestaurantId, dto.MenuItemId,
                dto.Rating, dto.Comment, dto.ImageUrls), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/orders/{id}/review — Customer gets their review for an order</summary>
    [HttpGet("v1/orders/{id:guid}/review")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> GetOrderReview(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetOrderReviewQuery(id, _currentUser.UserId!.Value), ct);
        return Ok(new { success = true, data = result });
    }

    // ── Restaurant reviews (vendor/staff) ─────────────────────────────────────
    /// <summary>GET v1/restaurants/{id}/reviews</summary>
    [HttpGet("v1/restaurants/{id:guid}/reviews")]
    [AllowAnonymous]
    public async Task<IActionResult> GetRestaurantReviews(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetRestaurantReviewsQuery(id, page, pageSize), ct);
        return Ok(new { success = true, data = result.Items, meta = new { result.TotalCount, page, pageSize } });
    }

    // ── Vendor reply ──────────────────────────────────────────────────────────
    /// <summary>POST v1/reviews/{id}/reply — Vendor replies to a review</summary>
    [HttpPost("v1/reviews/{id:guid}/reply")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> Reply(
        Guid id,
        [FromBody] ReplyReviewRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new ReplyReviewCommand(id, _currentUser.UserId!.Value, dto.Reply), ct);
        return Ok(new { success = true, data = result });
    }

    // ── Admin: hide review ────────────────────────────────────────────────────
    /// <summary>PATCH v1/admin/reviews/{id}/hide — Admin hides a review</summary>
    [HttpPatch("v1/admin/reviews/{id:guid}/hide")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> HideReview(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new HideReviewCommand(id), ct);
        return Ok(new { success = true, message = "Review hidden" });
    }

    // ── Customer: delete review ───────────────────────────────────────────────
    /// <summary>DELETE v1/reviews/{id}</summary>
    [HttpDelete("v1/reviews/{id:guid}")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(
            new DeleteReviewCommand(id, _currentUser.UserId!.Value, _currentUser.RoleType), ct);
        return Ok(new { success = true, message = "Review deleted" });
    }
}
