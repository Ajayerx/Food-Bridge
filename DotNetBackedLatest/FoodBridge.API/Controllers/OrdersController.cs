using FoodBridge.Application.DTOs.Orders;
using FoodBridge.Application.Features.Orders.Commands.CreateOrder;
using FoodBridge.Application.Features.Orders.Commands.UpdateOrderStatus;
using FoodBridge.Application.Features.Orders.Commands.CancelOrder;
using FoodBridge.Application.Features.Orders.Commands.AssignDeliveryAgent;
using FoodBridge.Application.Features.Orders.Queries.GetOrderById;
using FoodBridge.Application.Features.Orders.Queries.GetOrders;
using FoodBridge.Application.Features.Orders.Queries.GetOrderHistory;
using FoodBridge.Application.Features.Orders.Queries.CalculateCart;
using FoodBridge.Application.Features.Orders.Commands.SettleBill;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public OrdersController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>POST v1/orders — Place a new order</summary>
    [HttpPost]
    [Authorize(Roles = "Customer,Vendor,Staff")]
    public async Task<IActionResult> CreateOrder(
        [FromBody] CreateOrderRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateOrderCommand(
                _currentUser.UserId!.Value, 
                dto.RestaurantId,
                dto.OrderType,
                dto.DeliveryAddressId,
                dto.TableId,
                dto.Items,
                dto.CouponCode,
                dto.PaymentMethod,
                dto.Notes
            ), ct);
        return Ok(new { success = true, message = "Order placed successfully", data = result });
    }

    /// <summary>GET v1/orders</summary>
    [HttpGet]
    public async Task<IActionResult> GetOrders(
        [FromQuery] string? status,
        [FromQuery] Guid? restaurantId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetOrdersQuery(_currentUser.UserId!.Value, _currentUser.RoleType,
                restaurantId, status, page, pageSize), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/orders/{id}</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetOrderByIdQuery(id, _currentUser.UserId!.Value, _currentUser.RoleType), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>PATCH v1/orders/{id}/status</summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Vendor,Staff,Admin")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateOrderStatusRequestDto dto,
        CancellationToken ct)
    {
        await _mediator.Send(
            new UpdateOrderStatusCommand(id, _currentUser.UserId!.Value, dto.Status, dto.Reason), ct);
        return Ok(new { success = true, message = "Order status updated" });
    }

    /// <summary>POST v1/orders/{id}/cancel</summary>
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelOrder(
    Guid id,
    [FromBody] CancelOrderRequestDto dto,
    CancellationToken ct)
    {
        var userId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("User not authenticated.");
        var userRole = _currentUser.RoleType
            ?? throw new UnauthorizedAccessException("User role not found.");

        await _mediator.Send(
            new CancelOrderCommand(
                id,
                userId,
                dto.Reason,
                userRole), ct);

        return Ok(new { success = true, message = "Order cancelled successfully" });
    }
    /// <summary>POST v1/orders/{id}/assign-agent</summary>
    [HttpPost("{id:guid}/assign-agent")]
    [Authorize(Roles = "Vendor,Admin")]
    public async Task<IActionResult> AssignAgent(
    Guid id,
    [FromBody] AssignAgentRequestDto dto,
    CancellationToken ct)
    {
        await _mediator.Send(new AssignDeliveryAgentCommand(id, dto.AgentId), ct);
        return Ok(new { success = true, message = "Delivery agent assigned" });
    }

    [HttpPost("{id:guid}/auto-assign")]
    [Authorize(Roles = "Vendor,Admin")]
    public async Task<IActionResult> AutoAssign(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new AssignDeliveryAgentCommand(id, null), ct);
        return Ok(new { success = true, message = "Nearest agent auto-assigned" });
    }

    /// <summary>POST v1/orders/{id}/settle-bill</summary>
    [HttpPost("{id:guid}/settle-bill")]
    //[Authorize(Roles = "Vendor,Staff")]
    public async Task<IActionResult> SettleBill(
        Guid id,
        [FromQuery] string paymentMethod,
        CancellationToken ct)
    {
        await _mediator.Send(
            new SettleBillCommand(id, paymentMethod), ct);
        return Ok(new { success = true, message = "Bill settled successfully" });
    }
}

// ── Separate CartController for /v1/cart routes ───────────────────────────────
[ApiController]
[Route("v1/cart")]
public class CartController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public CartController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>GET v1/cart/calculate — Cart price preview (auth optional)</summary>
    [HttpGet("calculate")]
    public async Task<IActionResult> Calculate(
        [FromQuery] Guid restaurantId,
        [FromQuery] string? couponCode,
        [FromQuery] Guid? deliveryAddressId,
        [FromQuery] string orderType = "Delivery",
        [FromBody] CartCalculateRequestDto? body = null,
        CancellationToken ct = default)
    {
        // Accept items via body or as the body itself when it's a GET with body
        var items = body?.Items ?? new List<CartItemDto>();
        var effectiveCoupon = couponCode ?? body?.CouponCode;
        var effectiveRestaurantId = body?.RestaurantId != Guid.Empty ? (body?.RestaurantId ?? restaurantId) : restaurantId;

        var result = await _mediator.Send(
            new CalculateCartQuery(
                effectiveRestaurantId,
                items,
                effectiveCoupon,
                deliveryAddressId ?? body?.DeliveryAddressId,
                orderType,
                _currentUser.UserId), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/cart/calculate — Cart price preview (POST for full body)</summary>
    [HttpPost("calculate")]
    public async Task<IActionResult> CalculatePost(
        [FromBody] CartCalculateRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CalculateCartQuery(
                dto.RestaurantId, dto.Items, dto.CouponCode,
                dto.DeliveryAddressId, dto.OrderType, _currentUser.UserId), ct);
        return Ok(new { success = true, data = result });
    }

    
}
