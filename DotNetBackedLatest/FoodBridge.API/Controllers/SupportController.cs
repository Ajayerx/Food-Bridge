using FoodBridge.Application.DTOs.Support;
using FoodBridge.Application.Features.Support.Commands.CreateTicket;
using FoodBridge.Application.Features.Support.Commands.SendMessage;
using FoodBridge.Application.Features.Support.Commands.UpdateTicketStatus;
using FoodBridge.Application.Features.Support.Queries.GetTickets;
using FoodBridge.Application.Features.Support.Queries.GetTicketById;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/support")]
[Authorize]
public class SupportController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public SupportController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>GET v1/support/tickets</summary>
    [HttpGet("tickets")]
    public async Task<IActionResult> GetTickets(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetTicketsQuery(
                _currentUser.UserId!.Value,
                _currentUser.RoleType,
                status,
                page,
                pageSize), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/support/tickets/{id}</summary>
    [HttpGet("tickets/{id:guid}")]
    public async Task<IActionResult> GetTicketById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetTicketByIdQuery(
                id,
                _currentUser.UserId!.Value,
                _currentUser.RoleType), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/support/tickets — Create new support ticket</summary>
    [HttpPost("tickets")]
    public async Task<IActionResult> CreateTicket(
        [FromBody] CreateTicketRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateTicketCommand(
                _currentUser.UserId!.Value,
                dto.OrderId,
                dto.Subject,
                dto.Message), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/support/tickets/{id}/messages — Send message on ticket</summary>
    [HttpPost("tickets/{id:guid}/messages")]
    public async Task<IActionResult> SendMessage(
        Guid id,
        [FromBody] SendMessageRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new SendMessageCommand(
                id,
                _currentUser.UserId!.Value,
                _currentUser.RoleType,
                dto.Message,
                dto.AttachmentUrl), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>PATCH v1/support/tickets/{id}/status — Update ticket status</summary>
    [HttpPatch("tickets/{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateTicketStatusRequestDto dto,
        CancellationToken ct)
    {
        await _mediator.Send(
            new UpdateTicketStatusCommand(
                id,
                _currentUser.UserId!.Value,
                dto.Status), ct);

        return Ok(new { success = true, message = "Ticket status updated" });
    }
}