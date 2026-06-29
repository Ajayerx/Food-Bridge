using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.Features.Dispatch.Commands.AcceptDispatchOffer;
using FoodBridge.Application.Features.Dispatch.Commands.RejectDispatchOffer;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/dispatch")]
[Authorize(Roles = "DeliveryAgent")]
public class DispatchController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public DispatchController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>POST v1/dispatch/offers/{offerId}/accept — Accept a dispatch offer (first-accept-wins)</summary>
    [HttpPost("offers/{offerId:guid}/accept")]
    public async Task<IActionResult> AcceptOffer(Guid offerId, CancellationToken ct)
    {
        await _mediator.Send(
            new AcceptDispatchOfferCommand(offerId, _currentUser.UserId!.Value), ct);

        return Ok(new { success = true, message = "Offer accepted — order assigned to you." });
    }

    /// <summary>POST v1/dispatch/offers/{offerId}/reject — Decline a dispatch offer</summary>
    [HttpPost("offers/{offerId:guid}/reject")]
    public async Task<IActionResult> RejectOffer(Guid offerId, CancellationToken ct)
    {
        await _mediator.Send(
            new RejectDispatchOfferCommand(offerId, _currentUser.UserId!.Value), ct);

        return Ok(new { success = true, message = "Offer declined." });
    }
}