using FoodBridge.Application.DTOs.Menu;
using FoodBridge.Application.Features.Menu.Queries.SearchMenuItems;
using FoodBridge.Application.Features.Menu.Queries.GetPopularMenuItems;
using FoodBridge.Application.Features.Menu.Commands.CreateMenuItem;
using FoodBridge.Application.Features.Menu.Commands.UpdateMenuItem;
using FoodBridge.Application.Features.Menu.Commands.DeleteMenuItem;
using FoodBridge.Application.Features.Menu.Commands.UpdateMenuCategory;
using FoodBridge.Application.Features.Menu.Commands.DeleteMenuCategory;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

/// <summary>
/// Flat menu routes used by the frontend:
///   GET  /menu-items/search
///   GET  /menu-items/popular
///   POST /menu/items
///   PUT  /menu/items/:id
///   DELETE /menu/items/:id
///   PUT  /menu/categories/:id
///   DELETE /menu/categories/:id
/// </summary>
[ApiController]
public class MenuItemsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public MenuItemsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    // ── Public search & popular ────────────────────────────────────────────────
    /// <summary>GET v1/menu-items/search</summary>
    [HttpGet("v1/menu-items/search")]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] Guid? restaurantId,
        [FromQuery] string? dietaryTag,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new SearchMenuItemsQuery(q, restaurantId, dietaryTag, maxPrice, page, pageSize), ct);
        return Ok(new { success = true, data = result.Items, meta = new { result.TotalCount, page, pageSize } });
    }

    /// <summary>GET v1/menu-items/popular</summary>
    [HttpGet("v1/menu-items/popular")]
    public async Task<IActionResult> GetPopular(
        [FromQuery] Guid? restaurantId,
        [FromQuery] int limit = 10,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetPopularMenuItemsQuery(restaurantId, limit), ct);
        return Ok(new { success = true, data = result });
    }

    // ── Vendor/Manager: flat item CRUD ─────────────────────────────────────────
    /// <summary>POST v1/menu/items</summary>
    [HttpPost("v1/menu/items")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> CreateItem(
        [FromBody] CreateMenuItemWithRestaurantDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateMenuItemCommand(dto.CategoryId, dto.RestaurantId, dto.Name, dto.Description,
                dto.BasePrice, dto.ImageUrl, dto.DietaryTag, dto.PrepTimeMinutes), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>PUT v1/menu/items/{id}</summary>
    [HttpPut("v1/menu/items/{id:guid}")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> UpdateItem(
        Guid id,
        [FromBody] UpdateMenuItemWithRestaurantDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateMenuItemCommand(id, dto.RestaurantId, dto.Name, dto.Description,
                dto.BasePrice, dto.ImageUrl, dto.DietaryTag, dto.IsAvailable,
                dto.IsFeatured, dto.PrepTimeMinutes), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>DELETE v1/menu/items/{id}</summary>
    [HttpDelete("v1/menu/items/{id:guid}")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> DeleteItem(
        Guid id,
        [FromQuery] Guid restaurantId,
        CancellationToken ct)
    {
        await _mediator.Send(new DeleteMenuItemCommand(id, restaurantId), ct);
        return Ok(new { success = true, message = "Item deleted" });
    }

    // ── Vendor/Manager: flat category CRUD ────────────────────────────────────
    /// <summary>PUT v1/menu/categories/{id}</summary>
    [HttpPut("v1/menu/categories/{id:guid}")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> UpdateCategory(
        Guid id,
        [FromBody] UpdateMenuCategoryFlatDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateMenuCategoryCommand(id, dto.RestaurantId, dto.Name, dto.ImageUrl, dto.DisplayOrder), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>DELETE v1/menu/categories/{id}</summary>
    [HttpDelete("v1/menu/categories/{id:guid}")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> DeleteCategory(
        Guid id,
        [FromQuery] Guid restaurantId,
        CancellationToken ct)
    {
        await _mediator.Send(new DeleteMenuCategoryCommand(id, restaurantId), ct);
        return Ok(new { success = true, message = "Category deleted" });
    }
}

// ── Extra request DTOs for flat routes ───────────────────────────────────────
public class CreateMenuItemWithRestaurantDto
{
    public Guid RestaurantId { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public string? ImageUrl { get; set; }
    public string DietaryTag { get; set; } = "Veg";
    public int PrepTimeMinutes { get; set; } = 15;
}

public class UpdateMenuItemWithRestaurantDto
{
    public Guid RestaurantId { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal? BasePrice { get; set; }
    public string? ImageUrl { get; set; }
    public string? DietaryTag { get; set; }
    public bool? IsAvailable { get; set; }
    public bool? IsFeatured { get; set; }
    public int? PrepTimeMinutes { get; set; }
}

public class UpdateMenuCategoryFlatDto
{
    public Guid RestaurantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; }
}
