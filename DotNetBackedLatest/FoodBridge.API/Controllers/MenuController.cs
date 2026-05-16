using FoodBridge.Application.DTOs.Menu;
using FoodBridge.Application.Features.Menu.Commands.CreateMenuCategory;
using FoodBridge.Application.Features.Menu.Commands.UpdateMenuCategory;
using FoodBridge.Application.Features.Menu.Commands.DeleteMenuCategory;
using FoodBridge.Application.Features.Menu.Commands.CreateMenuItem;
using FoodBridge.Application.Features.Menu.Commands.UpdateMenuItem;
using FoodBridge.Application.Features.Menu.Commands.DeleteMenuItem;
using FoodBridge.Application.Features.Menu.Commands.CreateItemVariant;
using FoodBridge.Application.Features.Menu.Commands.UpdateItemVariant;
using FoodBridge.Application.Features.Menu.Commands.DeleteItemVariant;
using FoodBridge.Application.Features.Menu.Commands.CreateModifierGroup;
using FoodBridge.Application.Features.Menu.Commands.CreateModifierOption;
using FoodBridge.Application.Features.Menu.Commands.DeleteModifierGroup;
using FoodBridge.Application.Features.Menu.Queries.GetMenuCategories;
using FoodBridge.Application.Features.Menu.Queries.GetMenuItems;
using FoodBridge.Application.Features.Menu.Queries.GetMenuItemById;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/restaurants/{restaurantId:guid}/menu")]
public class MenuController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public MenuController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    // ── Categories ──────────────────────────────────────

    /// <summary>GET v1/restaurants/{restaurantId}/menu/categories</summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(Guid restaurantId, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetMenuCategoriesQuery(restaurantId), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/restaurants/{restaurantId}/menu/categories</summary>
    [HttpPost("categories")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> CreateCategory(
        Guid restaurantId,
        [FromBody] CreateMenuCategoryRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateMenuCategoryCommand(
                restaurantId,
                dto.Name,
                dto.ImageUrl,
                dto.DisplayOrder), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>PUT v1/restaurants/{restaurantId}/menu/categories/{categoryId}</summary>
    [HttpPut("categories/{categoryId:guid}")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> UpdateCategory(
        Guid restaurantId,
        Guid categoryId,
        [FromBody] CreateMenuCategoryRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateMenuCategoryCommand(
                categoryId,
                restaurantId,
                dto.Name,
                dto.ImageUrl,
                dto.DisplayOrder), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>DELETE v1/restaurants/{restaurantId}/menu/categories/{categoryId}</summary>
    [HttpDelete("categories/{categoryId:guid}")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> DeleteCategory(
        Guid restaurantId,
        Guid categoryId,
        CancellationToken ct)
    {
        await _mediator.Send(
            new DeleteMenuCategoryCommand(categoryId, restaurantId), ct);

        return Ok(new { success = true, message = "Category deleted" });
    }

    // ── Items ────────────────────────────────────────────

    /// <summary>GET v1/restaurants/{restaurantId}/menu/items</summary>
    [HttpGet("items")]
    public async Task<IActionResult> GetItems(
        Guid restaurantId,
        [FromQuery] Guid? categoryId,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetMenuItemsQuery(restaurantId, categoryId), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/restaurants/{restaurantId}/menu/items/{itemId}</summary>
    [HttpGet("items/{itemId:guid}")]
    public async Task<IActionResult> GetItemById(
        Guid restaurantId,
        Guid itemId,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetMenuItemByIdQuery(itemId, restaurantId), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/restaurants/{restaurantId}/menu/items</summary>
    [HttpPost("items")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> CreateItem(
        Guid restaurantId,
        [FromBody] CreateMenuItemRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateMenuItemCommand(
                dto.CategoryId,
                restaurantId,
                dto.Name,
                dto.Description,
                dto.BasePrice,
                dto.ImageUrl,
                dto.DietaryTag,
                dto.PrepTimeMinutes), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>PUT v1/restaurants/{restaurantId}/menu/items/{itemId}</summary>
    [HttpPut("items/{itemId:guid}")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> UpdateItem(
        Guid restaurantId,
        Guid itemId,
        [FromBody] UpdateMenuItemRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateMenuItemCommand(
                itemId,
                restaurantId,
                dto.Name,
                dto.Description,
                dto.BasePrice,
                dto.ImageUrl,
                dto.DietaryTag,
                dto.IsAvailable,
                dto.IsFeatured,
                dto.PrepTimeMinutes), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>DELETE v1/restaurants/{restaurantId}/menu/items/{itemId}</summary>
    [HttpDelete("items/{itemId:guid}")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> DeleteItem(
        Guid restaurantId,
        Guid itemId,
        CancellationToken ct)
    {
        await _mediator.Send(
            new DeleteMenuItemCommand(itemId, restaurantId), ct);

        return Ok(new { success = true, message = "Item deleted" });
    }

    // ── Variants ─────────────────────────────────────────

    /// <summary>POST v1/restaurants/{restaurantId}/menu/items/{itemId}/variants</summary>
    [HttpPost("items/{itemId:guid}/variants")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> CreateVariant(
        Guid restaurantId,
        Guid itemId,
        [FromBody] CreateVariantRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateItemVariantCommand(
                itemId,
                dto.Name,
                dto.Price), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>PUT v1/restaurants/{restaurantId}/menu/items/{itemId}/variants/{variantId}</summary>
    [HttpPut("items/{itemId:guid}/variants/{variantId:guid}")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> UpdateVariant(
        Guid restaurantId,
        Guid itemId,
        Guid variantId,
        [FromBody] CreateVariantRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateItemVariantCommand(
                variantId,
                itemId,
                dto.Name,
                dto.Price), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>DELETE v1/restaurants/{restaurantId}/menu/items/{itemId}/variants/{variantId}</summary>
    [HttpDelete("items/{itemId:guid}/variants/{variantId:guid}")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> DeleteVariant(
        Guid restaurantId,
        Guid itemId,
        Guid variantId,
        CancellationToken ct)
    {
        await _mediator.Send(
            new DeleteItemVariantCommand(variantId, itemId), ct);

        return Ok(new { success = true, message = "Variant deleted" });
    }

    // ── Modifier Groups ───────────────────────────────────

    /// <summary>POST v1/restaurants/{restaurantId}/menu/items/{itemId}/modifier-groups</summary>
    [HttpPost("items/{itemId:guid}/modifier-groups")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> CreateModifierGroup(
        Guid restaurantId,
        Guid itemId,
        [FromBody] CreateModifierGroupRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateModifierGroupCommand(
                itemId,
                dto.Name,
                dto.IsRequired,
                dto.MaxSelections), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>DELETE v1/restaurants/{restaurantId}/menu/items/{itemId}/modifier-groups/{groupId}</summary>
    [HttpDelete("items/{itemId:guid}/modifier-groups/{groupId:guid}")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> DeleteModifierGroup(
        Guid restaurantId,
        Guid itemId,
        Guid groupId,
        CancellationToken ct)
    {
        await _mediator.Send(
            new DeleteModifierGroupCommand(groupId, itemId), ct);

        return Ok(new { success = true, message = "Modifier group deleted" });
    }

    /// <summary>POST v1/restaurants/{restaurantId}/menu/items/{itemId}/modifier-groups/{groupId}/options</summary>
    [HttpPost("items/{itemId:guid}/modifier-groups/{groupId:guid}/options")]
    [Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> CreateModifierOption(
        Guid restaurantId,
        Guid itemId,
        Guid groupId,
        [FromBody] CreateModifierOptionRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateModifierOptionCommand(
                groupId,
                dto.Name,
                dto.AdditionalPrice), ct);

        return Ok(new { success = true, data = result });
    }
}