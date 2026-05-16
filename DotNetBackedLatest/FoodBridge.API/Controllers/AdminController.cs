using FoodBridge.Application.DTOs.Admin;
using FoodBridge.Application.Features.Admin.Queries.GetDashboardStats;
using FoodBridge.Application.Features.Admin.Queries.GetAllUsers;
using FoodBridge.Application.Features.Admin.Commands.BanUser;
using FoodBridge.Application.Features.Admin.Commands.UpdatePlatformSetting;
using FoodBridge.Application.Features.Admin.Queries.GetPlatformSettings;
using FoodBridge.Application.Features.Admin.Queries.GetCommissions;
using FoodBridge.Application.Features.Admin.Commands.UpdateCommission;
using FoodBridge.Application.Features.Admin.Queries.GetPayouts;
using FoodBridge.Application.Features.Admin.Commands.MarkPayoutProcessed;
using FoodBridge.Application.Features.Admin.Queries.GetBanners;
using FoodBridge.Application.Features.Admin.Commands.CreateBanner;
using FoodBridge.Application.Features.Admin.Commands.UpdateBanner;
using FoodBridge.Application.Features.Admin.Commands.DeleteBanner;
using FoodBridge.Application.Features.Admin.Commands.SuspendUser;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public AdminController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    // ── Dashboard ──────────────────────────────────────────────────────────────
    /// <summary>GET v1/admin/dashboard</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetDashboardStatsQuery(
                from ?? DateTime.UtcNow.AddDays(-30),
                to ?? DateTime.UtcNow), ct);
        return Ok(new { success = true, data = result });
    }

    // ── Users ──────────────────────────────────────────────────────────────────
    /// <summary>GET v1/admin/users</summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers(
        [FromQuery] string? role,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetAllUsersQuery(role, status, search, page, pageSize), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>PATCH v1/admin/users/{id}/ban</summary>
    [HttpPatch("users/{id:guid}/ban")]
    public async Task<IActionResult> BanUser(
        Guid id,
        [FromBody] BanUserRequestDto dto,
        CancellationToken ct)
    {
        await _mediator.Send(new BanUserCommand(id, _currentUser.UserId!.Value, dto.Reason), ct);
        return Ok(new { success = true, message = "User banned successfully" });
    }

    /// <summary>PATCH v1/admin/users/{id}/unban</summary>
    [HttpPatch("users/{id:guid}/unban")]
    public async Task<IActionResult> UnbanUser(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new BanUserCommand(id, _currentUser.UserId!.Value, null, Unban: true), ct);
        return Ok(new { success = true, message = "User unbanned successfully" });
    }

    /// <summary>PATCH v1/admin/users/{id}/suspend</summary>
    [HttpPatch("users/{id:guid}/suspend")]
    public async Task<IActionResult> SuspendUser(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new SuspendUserCommand(id, _currentUser.UserId!.Value), ct);
        return Ok(new { success = true, message = "User suspended successfully" });
    }

    /// <summary>PATCH v1/admin/users/{id}/reactivate</summary>
    [HttpPatch("users/{id:guid}/reactivate")]
    public async Task<IActionResult> ReactivateUser(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new SuspendUserCommand(id, _currentUser.UserId!.Value, Reactivate: true), ct);
        return Ok(new { success = true, message = "User reactivated successfully" });
    }

    // ── Settings ───────────────────────────────────────────────────────────────
    /// <summary>GET v1/admin/settings</summary>
    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPlatformSettingsQuery(), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>PUT v1/admin/settings</summary>
    [HttpPut("settings")]
    public async Task<IActionResult> UpdatePlatformSetting(
        [FromBody] UpdatePlatformSettingDto dto,
        CancellationToken ct)
    {
        await _mediator.Send(
            new UpdatePlatformSettingCommand(dto.Key, dto.Value, _currentUser.UserId!.Value), ct);
        return Ok(new { success = true, message = "Setting updated successfully" });
    }

    // ── Commission ─────────────────────────────────────────────────────────────
    /// <summary>GET v1/admin/commission</summary>
    [HttpGet("commission")]
    public async Task<IActionResult> GetCommissions(
        [FromQuery] Guid? restaurantId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetCommissionsQuery(restaurantId, from, to, page, pageSize), ct);
        return Ok(new { success = true, data = result.Items, meta = new { result.TotalCount, page, pageSize } });
    }

    /// <summary>PUT v1/admin/commission/{id}</summary>
    [HttpPut("commission/{id:guid}")]
    public async Task<IActionResult> UpdateCommission(
        Guid id,
        [FromBody] UpdateCommissionRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateCommissionCommand(id, dto.Rate, dto.Type, dto.Notes), ct);
        return Ok(new { success = true, data = result });
    }

    // ── Payouts ────────────────────────────────────────────────────────────────
    /// <summary>GET v1/admin/payouts</summary>
    [HttpGet("payouts")]
    public async Task<IActionResult> GetPayouts(
        [FromQuery] string? status,
        [FromQuery] Guid? vendorId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetPayoutsQuery(status, vendorId, page, pageSize), ct);
        return Ok(new { success = true, data = result.Items, meta = new { result.TotalCount, page, pageSize } });
    }

    /// <summary>PATCH v1/admin/payouts/{id}/mark-processed</summary>
    [HttpPatch("payouts/{id:guid}/mark-processed")]
    public async Task<IActionResult> MarkPayoutProcessed(
        Guid id,
        [FromBody] MarkPayoutProcessedRequestDto dto,
        CancellationToken ct)
    {
        await _mediator.Send(
            new MarkPayoutProcessedCommand(id, dto.TransactionId, dto.Notes), ct);
        return Ok(new { success = true, message = "Payout marked as processed" });
    }

    // ── Banners ────────────────────────────────────────────────────────────────
    /// <summary>GET v1/admin/banners — Public (no auth guard)</summary>
    [HttpGet("banners")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBanners(
        [FromQuery] bool activeOnly = false,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetBannersQuery(activeOnly), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/admin/banners</summary>
    [HttpPost("banners")]
    public async Task<IActionResult> CreateBanner(
        [FromBody] CreateBannerRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateBannerCommand(dto.Title, dto.SubTitle, dto.ImageUrl, dto.LinkUrl,
                dto.LinkType, dto.IsActive, dto.DisplayOrder, dto.StartsAt, dto.EndsAt), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>PATCH v1/admin/banners/{id}</summary>
    [HttpPatch("banners/{id:guid}")]
    public async Task<IActionResult> UpdateBanner(
        Guid id,
        [FromBody] UpdateBannerRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateBannerCommand(id, dto.Title, dto.SubTitle, dto.ImageUrl, dto.LinkUrl,
                dto.LinkType, dto.IsActive, dto.DisplayOrder, dto.StartsAt, dto.EndsAt), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>DELETE v1/admin/banners/{id}</summary>
    [HttpDelete("banners/{id:guid}")]
    public async Task<IActionResult> DeleteBanner(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteBannerCommand(id), ct);
        return Ok(new { success = true, message = "Banner deleted" });
    }
}

// DTO for mark-processed body
public class MarkPayoutProcessedRequestDto
{
    public string? TransactionId { get; set; }
    public string? Notes { get; set; }
}
