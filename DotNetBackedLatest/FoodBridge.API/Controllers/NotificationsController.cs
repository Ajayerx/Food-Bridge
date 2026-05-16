using FoodBridge.Application.DTOs.Notifications;
using FoodBridge.Application.Features.Notifications.Commands.RegisterDeviceToken;
using FoodBridge.Application.Features.Notifications.Commands.MarkNotificationRead;
using FoodBridge.Application.Features.Notifications.Commands.MarkAllNotificationsRead;
using FoodBridge.Application.Features.Notifications.Commands.DeleteNotification;
using FoodBridge.Application.Features.Notifications.Queries.GetNotifications;
using FoodBridge.Application.Features.Notifications.Queries.GetUnreadCount;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public NotificationsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>GET v1/notifications</summary>
    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] bool? unreadOnly,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetNotificationsQuery(_currentUser.UserId!.Value, unreadOnly ?? false, page, pageSize), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/notifications/unread-count</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        var count = await _mediator.Send(new GetUnreadCountQuery(_currentUser.UserId!.Value), ct);
        return Ok(new { success = true, data = new { count } });
    }

    /// <summary>POST v1/notifications/device-token</summary>
    [HttpPost("device-token")]
    public async Task<IActionResult> RegisterDeviceToken(
        [FromBody] RegisterDeviceTokenRequestDto dto,
        CancellationToken ct)
    {
        await _mediator.Send(
            new RegisterDeviceTokenCommand(
                _currentUser.UserId!.Value, dto.Token, dto.Platform, dto.DeviceId), ct);
        return Ok(new { success = true, message = "Device token registered" });
    }

    /// <summary>PATCH v1/notifications/mark-all-read — MUST come before /:id route</summary>
    [HttpPatch("mark-all-read")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        await _mediator.Send(new MarkAllNotificationsReadCommand(_currentUser.UserId!.Value), ct);
        return Ok(new { success = true, message = "All notifications marked as read" });
    }

    /// <summary>PATCH v1/notifications/{id}/read</summary>
    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new MarkNotificationReadCommand(id, _currentUser.UserId!.Value), ct);
        return Ok(new { success = true, message = "Notification marked as read" });
    }

    /// <summary>DELETE v1/notifications/{id}</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteNotificationCommand(id, _currentUser.UserId!.Value), ct);
        return Ok(new { success = true, message = "Notification deleted" });
    }
}
