using FoodBridge.Application.DTOs.Agents;
using FoodBridge.Application.Features.Agents.Commands.CreateAgent;
using FoodBridge.Application.Features.Agents.Commands.UpdateAgent;
using FoodBridge.Application.Features.Agents.Commands.DeleteAgent;
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
}