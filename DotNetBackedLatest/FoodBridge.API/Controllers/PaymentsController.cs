using FoodBridge.Application.DTOs.Payments;
using FoodBridge.Application.Features.Payments.Commands.CreateRazorpayOrder;
using FoodBridge.Application.Features.Payments.Commands.HandleWebhook;
using FoodBridge.Application.Features.Payments.Queries.GetPaymentByOrderId;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public PaymentsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>POST v1/payments/create-order — Create Razorpay order</summary>
    [HttpPost("create-order")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> CreateRazorpayOrder(
        [FromBody] CreateRazorpayOrderRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateRazorpayOrderCommand(
                dto.OrderId,
                _currentUser.UserId!.Value), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/payments/order/{orderId} — Get payment by order ID</summary>
    [HttpGet("order/{orderId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetByOrderId(Guid orderId, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetPaymentByOrderIdQuery(
                orderId,
                _currentUser.UserId!.Value,
                _currentUser.RoleType), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/payments/webhook — Razorpay webhook handler</summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleWebhook(
        [FromBody] PaymentWebhookDto dto,
        [FromHeader(Name = "X-Razorpay-Signature")] string signature,
        CancellationToken ct)
    {
        await _mediator.Send(
            new HandlePaymentWebhookCommand(
                dto.Event,
                dto.Payload,
                signature), ct);

        return Ok(new { success = true });
    }
}