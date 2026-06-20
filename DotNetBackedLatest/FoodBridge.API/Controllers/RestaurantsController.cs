using FoodBridge.Application.DTOs.Restaurants;
using FoodBridge.Application.Features.Restaurants.Commands.CreateRestaurant;
using FoodBridge.Application.Features.Restaurants.Commands.UpdateRestaurant;
using FoodBridge.Application.Features.Restaurants.Commands.ApproveRestaurant;
using FoodBridge.Application.Features.Restaurants.Commands.ToggleRestaurantStatus;
using FoodBridge.Application.Features.Restaurants.Commands.SubmitForApproval;
using FoodBridge.Application.Features.Restaurants.Commands.RejectRestaurant;
using FoodBridge.Application.Features.Restaurants.Commands.SuspendRestaurant;
using FoodBridge.Application.Features.Restaurants.Commands.UnsuspendRestaurant;
using FoodBridge.Application.Features.Restaurants.Queries.GetRestaurantById;
using FoodBridge.Application.Features.Restaurants.Queries.GetRestaurants;
using FoodBridge.Application.Features.Restaurants.Queries.GetAdminRestaurants;
//using FoodBridge.Application.Features.Restaurants.Queries.GetRestaurantTables;
using FoodBridge.Application.Features.Restaurants.Queries.GetMyRestaurants;
using FoodBridge.Application.Features.Restaurants.Queries.SearchRestaurants;
using FoodBridge.Application.Features.Restaurants.Queries.GetRestaurantMenu;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/restaurants")]
public class RestaurantsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public RestaurantsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    // ── Public listing & search ────────────────────────────────────────────────
    /// <summary>GET v1/restaurants</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
     [FromQuery] string? city,
     [FromQuery] string? search,
     [FromQuery] int page = 1,
     [FromQuery] int pageSize = 20,
     [FromQuery] bool? isPureVeg = null,
     [FromQuery] decimal? minRating = null,
     [FromQuery] int? maxPrepTime = null,
     [FromQuery] decimal? maxCost = null,
     [FromQuery] bool? popular = null,
     [FromQuery] bool? isNew = null,
     [FromQuery] string? sortBy = null,
     CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetRestaurantsQuery(
                city, search, page, pageSize,
                isPureVeg, minRating, maxPrepTime,
                maxCost, popular, isNew, sortBy), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/restaurants/search</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] string? city,
        [FromQuery] decimal? lat,
        [FromQuery] decimal? lng,
        [FromQuery] decimal? radiusKm,
        [FromQuery] bool? isOpen,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new SearchRestaurantsQuery(q, city, lat, lng, radiusKm, isOpen, page, pageSize), ct);
        return Ok(new { success = true, data = result.Items, meta = new { result.TotalCount, page, pageSize } });
    }

    /// <summary>GET v1/restaurants/mine — vendor or staff own restaurants</summary>
    [HttpGet("mine")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetMyRestaurantsQuery(_currentUser.UserId!.Value, _currentUser.RoleType), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/restaurants/{id}</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetRestaurantByIdQuery(id), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/restaurants</summary>
    [HttpPost]
    [Authorize(Roles = "Vendor")]
    public async Task<IActionResult> Create(
        [FromBody] CreateRestaurantRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateRestaurantCommand(
                _currentUser.UserId!.Value, dto.Name, dto.Description, dto.AddressLine,
                dto.City, dto.State, dto.PinCode, dto.Latitude, dto.Longitude,
                dto.PhoneNumber, dto.FssaiLicense, dto.DeliveryFee,
                dto.MinOrderAmount, dto.AvgDeliveryMinutes), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>PUT v1/restaurants/{id}</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateRestaurantRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateRestaurantCommand(
                id, _currentUser.UserId!.Value, dto.Name, dto.Description, dto.AddressLine,
                dto.City, dto.State, dto.PinCode, dto.Latitude, dto.Longitude,
                dto.PhoneNumber, dto.DeliveryFee, dto.MinOrderAmount, dto.AvgDeliveryMinutes), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/restaurants/{id}/submit-for-approval</summary>
    [HttpPost("{id:guid}/submit-for-approval")]
    [Authorize(Roles = "Vendor")]
    public async Task<IActionResult> SubmitForApproval(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new SubmitForApprovalCommand(id, _currentUser.UserId!.Value), ct);
        return Ok(new { success = true, message = "Restaurant submitted for approval" });
    }

    /// <summary>PATCH v1/restaurants/{id}/toggle-active</summary>
    [HttpPatch("{id:guid}/toggle-active")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> ToggleActive(Guid id, CancellationToken ct)
    {
        var isOpen = await _mediator.Send(
            new ToggleRestaurantStatusCommand(id, _currentUser.UserId!.Value), ct);

        return Ok(new
        {
            success = true,
            message = "Restaurant status toggled",
            data = new { isOpen } 
        });
    }

    // ── Admin: approval flow ───────────────────────────────────────────────────
    /// <summary>PATCH v1/admin/restaurants/{id}/approve</summary>
    [HttpPatch("/v1/admin/restaurants/{id:guid}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new ApproveRestaurantCommand(id), ct);
        return Ok(new { success = true, message = "Restaurant approved successfully" });
    }

    /// <summary>PATCH v1/admin/restaurants/{id}/reject</summary>
    [HttpPatch("/v1/admin/restaurants/{id:guid}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reject(
        Guid id,
        [FromBody] RejectReasonDto? dto,
        CancellationToken ct)
    {
        await _mediator.Send(new RejectRestaurantCommand(id, dto?.Reason), ct);
        return Ok(new { success = true, message = "Restaurant rejected" });
    }

    /// <summary>PATCH v1/admin/restaurants/{id}/suspend</summary>
    [HttpPatch("/v1/admin/restaurants/{id:guid}/suspend")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Suspend(
        Guid id,
        [FromBody] RejectReasonDto? dto,
        CancellationToken ct)
    {
        await _mediator.Send(new SuspendRestaurantCommand(id, dto?.Reason), ct);
        return Ok(new { success = true, message = "Restaurant suspended" });
    }


    /// <summary>PATCH v1/admin/restaurants/{id}/unsuspend</summary>
    [HttpPatch("/v1/admin/restaurants/{id:guid}/unsuspend")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Unsuspend(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new UnsuspendRestaurantCommand(id), ct);
        return Ok(new { success = true, message = "Restaurant unsuspended successfully" });
    }

    // ── Admin listing ──────────────────────────────────────────────────────────
    /// <summary>GET v1/admin/restaurants</summary>
    [HttpGet("/v1/admin/restaurants")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminRestaurants(
    [FromQuery] string? status,
    [FromQuery] string? search,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20,
    CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetAdminRestaurantsQuery(status, search, page, pageSize), ct);
        return Ok(new { success = true, data = result });
    }

    // ── Menu: public read ──────────────────────────────────────────────────────
    /// <summary>GET v1/restaurants/{id}/menu</summary>
    [HttpGet("{id:guid}/menu")]
    public async Task<IActionResult> GetMenu(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetRestaurantMenuQuery(id), ct);
        return Ok(new { success = true, data = result });
    }

    //// ── Tables ────────────────────────────────────────────────────────────────
    ///// <summary>GET v1/restaurants/{id}/tables</summary>
    //[HttpGet("{id:guid}/tables")]
    //[Authorize(Roles = "Vendor,Staff")]
    //public async Task<IActionResult> GetTables(Guid id, CancellationToken ct)
    //{
    //    var result = await _mediator.Send(new GetRestaurantTablesQuery(id), ct);
    //    return Ok(new { success = true, data = result });
    //}


}

public class RejectReasonDto
{
    public string? Reason { get; set; }
}
