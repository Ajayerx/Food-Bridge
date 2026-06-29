using FoodBridge.Application.DTOs.Agents;
using FoodBridge.Application.Features.Agents.Commands.CreateAgent;
using FoodBridge.Application.Features.Agents.Commands.UpdateAgent;
using FoodBridge.Application.Features.Agents.Commands.DeleteAgent;
using FoodBridge.Application.Features.Agents.Commands.ApproveAgent;
using FoodBridge.Application.Features.Agents.Commands.RejectAgent;
using FoodBridge.Application.Features.Agents.Commands.SuspendAgent;
using FoodBridge.Application.Features.Agents.Commands.UnsuspendAgent;
using FoodBridge.Application.Features.Agents.Queries.GetAgents;
using FoodBridge.Application.Features.Agents.Queries.GetAgentById;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/agents")]
[Authorize(Roles = "Admin")]
public class AgentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public AgentsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>GET v1/agents</summary>
    [HttpGet]
    public async Task<IActionResult> GetAgents(
        [FromQuery] string? status,
        [FromQuery] bool? availableOnly,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetAgentsQuery(
                status,
                availableOnly ?? false,
                page,
                pageSize), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/agents/{id}</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetAgentByIdQuery(id), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/agents — Register new delivery agent</summary>
    [HttpPost]
    public async Task<IActionResult> CreateAgent(
        [FromBody] CreateAgentRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateAgentCommand(
                dto.MobileNumber,
                dto.FullName,
                dto.Email,
                dto.VehicleType,
                dto.VehicleNumber,
                dto.LicenseNumber), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>PUT v1/agents/{id}</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAgent(
        Guid id,
        [FromBody] CreateAgentRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateAgentCommand(
                id,
                dto.FullName,
                dto.Email,
                dto.VehicleType,
                dto.VehicleNumber,
                dto.LicenseNumber), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>DELETE v1/agents/{id}</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAgent(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteAgentCommand(id), ct);

        return Ok(new { success = true, message = "Agent removed" });
    }

    /// <summary>PATCH v1/agents/{id}/approve — Admin: approve pending agent</summary>
    [HttpPatch("{id:guid}/approve")]
    public async Task<IActionResult> ApproveAgent(Guid id, CancellationToken ct)
    {
        var adminUserId = _currentUser.UserId!.Value;
        await _mediator.Send(new ApproveAgentCommand(id, adminUserId), ct);

        return Ok(new { success = true, message = "Agent approved successfully" });
    }

    /// <summary>PATCH v1/agents/{id}/reject — Admin: reject pending agent</summary>
    [HttpPatch("{id:guid}/reject")]
    public async Task<IActionResult> RejectAgent(
        Guid id,
        [FromBody] RejectAgentRequestDto? dto,
        CancellationToken ct)
    {
        var adminUserId = _currentUser.UserId!.Value;
        await _mediator.Send(new RejectAgentCommand(id, adminUserId, dto?.Reason), ct);

        return Ok(new { success = true, message = "Agent rejected" });
    }

    /// <summary>PATCH v1/agents/{id}/suspend — Admin: suspend an active agent</summary>
    [HttpPatch("{id:guid}/suspend")]
    public async Task<IActionResult> SuspendAgent(
        Guid id,
        [FromBody] RejectAgentRequestDto? dto,
        CancellationToken ct)
    {
        var adminUserId = _currentUser.UserId!.Value;
        await _mediator.Send(new SuspendAgentCommand(id, adminUserId, dto?.Reason), ct);

        return Ok(new { success = true, message = "Agent suspended successfully" });
    }

    /// <summary>PATCH v1/agents/{id}/unsuspend — Admin: reinstate a suspended agent</summary>
    [HttpPatch("{id:guid}/unsuspend")]
    public async Task<IActionResult> UnsuspendAgent(Guid id, CancellationToken ct)
    {
        var adminUserId = _currentUser.UserId!.Value;
        await _mediator.Send(new UnsuspendAgentCommand(id, adminUserId), ct);

        return Ok(new { success = true, message = "Agent unsuspended successfully" });
    }
}