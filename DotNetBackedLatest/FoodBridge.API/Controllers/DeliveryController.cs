using FoodBridge.Application.DTOs.Delivery;
using FoodBridge.Application.Features.Delivery.Commands.UpdateTaskStatus;
using FoodBridge.Application.Features.Delivery.Commands.ToggleAvailability;
using FoodBridge.Application.Features.Delivery.Queries.GetMyTasks;
using FoodBridge.Application.Features.Delivery.Queries.GetTaskById;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/delivery")]
[Authorize(Roles = "DeliveryAgent")]
public class DeliveryController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public DeliveryController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>GET v1/delivery/tasks — Get my assigned tasks</summary>
    [HttpGet("tasks")]
    public async Task<IActionResult> GetMyTasks(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetMyTasksQuery(
                _currentUser.UserId!.Value,
                status,
                page,
                pageSize), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/delivery/tasks/{id}</summary>
    [HttpGet("tasks/{id:guid}")]
    public async Task<IActionResult> GetTaskById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetTaskByIdQuery(id, _currentUser.UserId!.Value), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>PATCH v1/delivery/tasks/{id}/status — Update delivery task status</summary>
    [HttpPatch("tasks/{id:guid}/status")]
    public async Task<IActionResult> UpdateTaskStatus(
        Guid id,
        [FromBody] UpdateTaskStatusRequestDto dto,
        CancellationToken ct)
    {
        await _mediator.Send(
            new UpdateTaskStatusCommand(
                id,
                _currentUser.UserId!.Value,
                dto.Status,
                dto.Notes,
                dto.CurrentLatitude,
                dto.CurrentLongitude), ct);

        return Ok(new { success = true, message = "Task status updated" });
    }

    /// <summary>PATCH v1/delivery/availability — Toggle agent availability</summary>
    [HttpPatch("availability")]
    public async Task<IActionResult> ToggleAvailability(
        [FromBody] ToggleAvailabilityRequestDto dto,
        CancellationToken ct)
    {
        await _mediator.Send(
            new ToggleAvailabilityCommand(
                _currentUser.UserId!.Value,
                dto.IsAvailable,
                dto.CurrentLatitude,
                dto.CurrentLongitude), ct);

        return Ok(new { success = true, message = "Availability updated" });
    }
}