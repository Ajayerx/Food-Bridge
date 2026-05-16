using FoodBridge.Application.Features.Reports.Queries.GetSalesReport;
using FoodBridge.Application.Features.Reports.Queries.GetOrderReport;
using FoodBridge.Application.Features.Reports.Queries.GetRevenueReport;
using FoodBridge.Application.Features.Reports.Queries.GetVendorOrderReport;
using FoodBridge.Application.Features.Reports.Queries.GetVendorItemReport;
using FoodBridge.Application.Features.Reports.Queries.GetVendorDailyReport;
using FoodBridge.Application.Features.Reports.Queries.GetVendorDeliveryReport;
using FoodBridge.Application.Features.Reports.Queries.GetAdminPlatformReport;
using FoodBridge.Application.Features.Reports.Queries.GetAdminVendorsReport;
using FoodBridge.Application.Features.Reports.Queries.GetAdminFinancialsReport;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ReportsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    // ── Legacy generic reports (backward compatible) ───────────────────────────
    /// <summary>GET v1/reports/sales</summary>
    [HttpGet("sales")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<IActionResult> GetSalesReport(
        [FromQuery] Guid? restaurantId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string groupBy = "day",
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetSalesReportQuery(_currentUser.UserId!.Value, _currentUser.RoleType, restaurantId,
                from ?? DateTime.UtcNow.AddDays(-30), to ?? DateTime.UtcNow, groupBy), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/reports/orders</summary>
    [HttpGet("orders")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<IActionResult> GetOrderReport(
        [FromQuery] Guid? restaurantId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? status,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetOrderReportQuery(_currentUser.UserId!.Value, _currentUser.RoleType, restaurantId,
                from ?? DateTime.UtcNow.AddDays(-30), to ?? DateTime.UtcNow, status), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/reports/revenue</summary>
    [HttpGet("revenue")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<IActionResult> GetRevenueReport(
        [FromQuery] Guid? restaurantId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string groupBy = "day",
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetRevenueReportQuery(_currentUser.UserId!.Value, _currentUser.RoleType, restaurantId,
                from ?? DateTime.UtcNow.AddDays(-30), to ?? DateTime.UtcNow, groupBy), ct);
        return Ok(new { success = true, data = result });
    }

    // ── Vendor-scoped reports ──────────────────────────────────────────────────
    /// <summary>GET v1/reports/vendor/sales</summary>
    [HttpGet("vendor/sales")]
    [Authorize(Roles = "Admin,Vendor,Staff")]
    public async Task<IActionResult> GetVendorSales(
        [FromQuery] Guid? restaurantId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string groupBy = "day",
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetSalesReportQuery(_currentUser.UserId!.Value, _currentUser.RoleType, restaurantId,
                from ?? DateTime.UtcNow.AddDays(-30), to ?? DateTime.UtcNow, groupBy), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/reports/vendor/orders</summary>
    [HttpGet("vendor/orders")]
    [Authorize(Roles = "Admin,Vendor,Staff")]
    public async Task<IActionResult> GetVendorOrders(
        [FromQuery] Guid? restaurantId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetVendorOrderReportQuery(_currentUser.UserId!.Value, _currentUser.RoleType, restaurantId,
                from ?? DateTime.UtcNow.AddDays(-30), to ?? DateTime.UtcNow), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/reports/vendor/items</summary>
    [HttpGet("vendor/items")]
    [Authorize(Roles = "Admin,Vendor,Staff")]
    public async Task<IActionResult> GetVendorItems(
        [FromQuery] Guid? restaurantId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int limit = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetVendorItemReportQuery(_currentUser.UserId!.Value, _currentUser.RoleType, restaurantId,
                from ?? DateTime.UtcNow.AddDays(-30), to ?? DateTime.UtcNow, limit), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/reports/vendor/daily</summary>
    [HttpGet("vendor/daily")]
    [Authorize(Roles = "Admin,Vendor,Staff")]
    public async Task<IActionResult> GetVendorDaily(
        [FromQuery] Guid? restaurantId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetVendorDailyReportQuery(_currentUser.UserId!.Value, _currentUser.RoleType, restaurantId,
                from ?? DateTime.UtcNow.AddDays(-30), to ?? DateTime.UtcNow), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/reports/vendor/delivery</summary>
    [HttpGet("vendor/delivery")]
    [Authorize(Roles = "Admin,Vendor,Staff")]
    public async Task<IActionResult> GetVendorDelivery(
        [FromQuery] Guid? restaurantId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetVendorDeliveryReportQuery(_currentUser.UserId!.Value, _currentUser.RoleType, restaurantId,
                from ?? DateTime.UtcNow.AddDays(-30), to ?? DateTime.UtcNow), ct);
        return Ok(new { success = true, data = result });
    }

    // ── Admin-scoped reports ───────────────────────────────────────────────────
    /// <summary>GET v1/reports/admin/platform</summary>
    [HttpGet("admin/platform")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminPlatform(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetAdminPlatformReportQuery(
                from ?? DateTime.UtcNow.AddDays(-30), to ?? DateTime.UtcNow), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/reports/admin/vendors</summary>
    [HttpGet("admin/vendors")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminVendors(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int limit = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetAdminVendorsReportQuery(
                from ?? DateTime.UtcNow.AddDays(-30), to ?? DateTime.UtcNow, limit), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/reports/admin/financials</summary>
    [HttpGet("admin/financials")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminFinancials(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string groupBy = "day",
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetAdminFinancialsReportQuery(
                from ?? DateTime.UtcNow.AddDays(-30), to ?? DateTime.UtcNow, groupBy), ct);
        return Ok(new { success = true, data = result });
    }
}
