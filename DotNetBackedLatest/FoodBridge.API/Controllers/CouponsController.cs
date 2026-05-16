using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Coupons;
using FoodBridge.Application.Features.Coupons.Commands.CreateCoupon;
using FoodBridge.Application.Features.Coupons.Commands.DeleteCoupon;
using FoodBridge.Application.Features.Coupons.Commands.UpdateCoupon;
using FoodBridge.Application.Features.Coupons.Commands.ValidateCoupon;
using FoodBridge.Application.Features.Coupons.Queries.GetCoupons;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/coupons")]
[Authorize]
public class CouponsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public CouponsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>GET v1/coupons — Get all coupons</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? restaurantId,
        [FromQuery] bool? activeOnly,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetCouponsQuery(
                restaurantId,
                activeOnly ?? true,
                page,
                pageSize), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/coupons — Create coupon (Admin/Vendor only)</summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<IActionResult> Create(
        [FromBody] CreateCouponRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateCouponCommand(
                _currentUser.UserId!.Value,
                dto.Code,
                dto.Description,
                dto.CouponType,
                dto.DiscountValue,
                dto.MinOrderAmount,
                dto.MaxDiscountAmount,
                dto.UsageLimit,
                dto.PerUserLimit,
                dto.RestaurantId,
                dto.ExpiresAt), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>PUT v1/coupons/{id} — Update coupon</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] CreateCouponRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateCouponCommand(
                id,
                _currentUser.UserId!.Value,
                dto.Description,
                dto.DiscountValue,
                dto.MinOrderAmount,
                dto.MaxDiscountAmount,
                dto.UsageLimit,
                dto.PerUserLimit,
                dto.ExpiresAt), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>DELETE v1/coupons/{id} — Delete coupon</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(
            new DeleteCouponCommand(id, _currentUser.UserId!.Value), ct);

        return Ok(new { success = true, message = "Coupon deleted" });
    }

    /// <summary>POST v1/coupons/validate — Validate coupon before applying</summary>
    [HttpPost("validate")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Validate(
        [FromBody] ValidateCouponRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new ValidateCouponCommand(
                dto.Code,
                dto.RestaurantId,
                dto.OrderAmount,
                _currentUser.UserId!.Value), ct);

        return Ok(new { success = true, data = result });
    }


}
