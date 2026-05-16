using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Restaurants;
using FoodBridge.Application.Features.Restaurants.Commands.CreateTable;
using FoodBridge.Application.Features.Restaurants.Commands.DeleteTable;
using FoodBridge.Application.Features.Restaurants.Commands.ReserveTable;
using FoodBridge.Application.Features.Restaurants.Commands.ToggleTableAvailability;
using FoodBridge.Application.Features.Restaurants.Commands.UpdateTable;
using FoodBridge.Application.Features.Restaurants.Queries.GetRestaurantTables;
using FoodBridge.Application.Features.Restaurants.Queries.GetTableById;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/restaurants/{restaurantId:guid}/tables")]
[Authorize(Roles = "Vendor,Staff")]
public class TablesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public TablesController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>GET v1/restaurants/{restaurantId}/tables</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid restaurantId, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetRestaurantTablesQuery(restaurantId), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/restaurants/{restaurantId}/tables/{tableId}</summary>
    [HttpGet("{tableId:guid}")]
    public async Task<IActionResult> GetById(Guid restaurantId, Guid tableId, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetTableByIdQuery(tableId), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/restaurants/{restaurantId}/tables</summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        Guid restaurantId,
        [FromBody] CreateTableRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateTableCommand(
                restaurantId,
                _currentUser.UserId!.Value,
                dto.TableNumber,
                dto.Capacity), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>PUT v1/restaurants/{restaurantId}/tables/{tableId}</summary>
    [HttpPut("{tableId:guid}")]
    public async Task<IActionResult> Update(
    Guid restaurantId,
    Guid tableId,
    [FromBody] UpdateTableRequestDto dto,
    CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateTableCommand(
                tableId,
                _currentUser.UserId!.Value,
                dto.TableNumber,
                dto.Capacity,
                dto.Status), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>DELETE v1/restaurants/{restaurantId}/tables/{tableId}</summary>
    [HttpDelete("{tableId:guid}")]
    public async Task<IActionResult> Delete(
        Guid restaurantId,
        Guid tableId,
        CancellationToken ct)
    {
        await _mediator.Send(
            new DeleteTableCommand(tableId, _currentUser.UserId!.Value), ct);

        return Ok(new { success = true, message = "Table deleted successfully" });
    }

    /// <summary>PATCH v1/restaurants/{restaurantId}/tables/{tableId}/toggle-availability</summary>
    [HttpPatch("{tableId:guid}/toggle-availability")]
    public async Task<IActionResult> ToggleAvailability(
        Guid restaurantId,
        Guid tableId,
        CancellationToken ct)
    {
        await _mediator.Send(
            new ToggleTableAvailabilityCommand(tableId, _currentUser.UserId!.Value), ct);

        return Ok(new { success = true, message = "Table availability toggled" });
    }

    /// <summary>PATCH v1/restaurants/{restaurantId}/tables/{tableId}/reserve</summary>
    [HttpPatch("{tableId:guid}/reserve")]
    public async Task<IActionResult> ReserveTable(
        Guid restaurantId,
        Guid tableId,
        CancellationToken ct)
    {
        await _mediator.Send(
            new ReserveTableCommand(tableId, _currentUser.UserId!.Value), ct);

        return Ok(new { success = true, message = "Table reserved successfully" });
    }
}