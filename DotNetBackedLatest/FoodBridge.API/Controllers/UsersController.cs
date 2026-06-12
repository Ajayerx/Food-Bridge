using FoodBridge.Application.DTOs.Users;
using FoodBridge.Application.Features.Users.Commands.UpdateProfile;
using FoodBridge.Application.Features.Users.Commands.AddAddress;
using FoodBridge.Application.Features.Users.Commands.UpdateAddress;
using FoodBridge.Application.Features.Users.Commands.DeleteAddress;
using FoodBridge.Application.Features.Users.Commands.SetDefaultAddress;
using FoodBridge.Application.Features.Users.Commands.DeleteAccount;
using FoodBridge.Application.Features.Users.Queries.GetProfile;
using FoodBridge.Application.Features.Users.Queries.GetAddresses;
using FoodBridge.Application.Features.Admin.Commands.SuspendUser;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public UsersController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>GET v1/me</summary>
    [HttpGet("v1/me")]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetProfileQuery(_currentUser.UserId!.Value), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>PUT v1/me</summary>
    [HttpPut("v1/me")]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateProfileCommand(_currentUser.UserId!.Value, dto.FullName, dto.Email, dto.AvatarUrl), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>GET v1/me/addresses</summary>
    [HttpGet("v1/me/addresses")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> GetAddresses(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAddressesQuery(_currentUser.UserId!.Value), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/me/addresses</summary>
    [HttpPost("v1/me/addresses")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> AddAddress(
        [FromBody] AddressRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new AddAddressCommand(_currentUser.UserId!.Value, dto.Label, dto.AddressLine1,
                dto.AddressLine2, dto.City, dto.State, dto.PinCode,
                dto.Latitude, dto.Longitude, dto.IsDefault), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>PUT v1/me/addresses/{id}</summary>
    [HttpPut("v1/me/addresses/{id:guid}")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> UpdateAddress(
        Guid id,
        [FromBody] AddressRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateAddressCommand(id, _currentUser.UserId!.Value, dto.Label, dto.AddressLine1,
                dto.AddressLine2, dto.City, dto.State, dto.PinCode,
                dto.Latitude, dto.Longitude, dto.IsDefault), ct);
        return Ok(new { success = true, data = result });
    }

    /// <summary>DELETE v1/me/addresses/{id}</summary>
    [HttpDelete("v1/me/addresses/{id:guid}")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> DeleteAddress(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteAddressCommand(id, _currentUser.UserId!.Value), ct);
        return Ok(new { success = true, message = "Address deleted successfully" });
    }

    /// <summary>PUT v1/me/addresses/{id}/default</summary>
    [HttpPut("v1/me/addresses/{id:guid}/default")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> SetDefaultAddress(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new SetDefaultAddressCommand(id, _currentUser.UserId!.Value), ct);
        return Ok(new { success = true });
    }

    /// <summary>POST v1/me/delete-account</summary>
    [HttpPost("v1/me/delete-account")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> DeleteAccount(CancellationToken ct)
    {
        await _mediator.Send(new DeleteAccountCommand(_currentUser.UserId!.Value), ct);
        return Ok(new { success = true, message = "Account deletion requested" });
    }

    // ── Admin user management ─────────────────────────────────────────────────
    /// <summary>PATCH v1/admin/users/{id}/suspend</summary>
    //[HttpPatch("v1/admin/users/{id:guid}/suspend")]
    //[Authorize(Roles = "Admin")]
    //public async Task<IActionResult> SuspendUser(Guid id, CancellationToken ct)
    //{
    //    await _mediator.Send(new SuspendUserCommand(id, _currentUser.UserId!.Value), ct);
    //    return Ok(new { success = true, message = "User suspended" });
    //}

    /// <summary>PATCH v1/admin/users/{id}/reactivate</summary>
    //[HttpPatch("v1/admin/users/{id:guid}/reactivate")]
    //[Authorize(Roles = "Admin")]
    //public async Task<IActionResult> ReactivateUser(Guid id, CancellationToken ct)
    //{
    //    await _mediator.Send(new SuspendUserCommand(id, _currentUser.UserId!.Value, Reactivate: true), ct);
    //    return Ok(new { success = true, message = "User reactivated" });
    //}
}
