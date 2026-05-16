using FoodBridge.Application.DTOs.Staff;
using FoodBridge.Application.Features.Staff.Commands.CreateStaff;
using FoodBridge.Application.Features.Staff.Commands.UpdateStaff;
using FoodBridge.Application.Features.Staff.Commands.DeleteStaff;
using FoodBridge.Application.Features.Staff.Queries.GetStaffList;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/restaurants/{restaurantId:guid}/staff")]
[Authorize(Roles = "Vendor,Admin")]
public class StaffController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public StaffController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>GET v1/restaurants/{restaurantId}/staff</summary>
    [HttpGet]
    public async Task<IActionResult> GetStaffList(
        Guid restaurantId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetStaffListQuery(
                restaurantId,
                _currentUser.UserId!.Value,
                page,
                pageSize), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/restaurants/{restaurantId}/staff</summary>
    [HttpPost]
    public async Task<IActionResult> CreateStaff(
        Guid restaurantId,
        [FromBody] CreateStaffRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateStaffCommand(
                restaurantId,
                _currentUser.UserId!.Value,
                dto.MobileNumber,
                dto.FullName,
                dto.Email,
                dto.StaffRole), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>PUT v1/restaurants/{restaurantId}/staff/{staffId}</summary>
    [HttpPut("{staffId:guid}")]
    public async Task<IActionResult> UpdateStaff(
        Guid restaurantId,
        Guid staffId,
        [FromBody] CreateStaffRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new UpdateStaffCommand(
                staffId,
                restaurantId,
                _currentUser.UserId!.Value,
                dto.FullName,
                dto.Email,
                dto.StaffRole), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>DELETE v1/restaurants/{restaurantId}/staff/{staffId}</summary>
    [HttpDelete("{staffId:guid}")]
    public async Task<IActionResult> DeleteStaff(
        Guid restaurantId,
        Guid staffId,
        CancellationToken ct)
    {
        await _mediator.Send(
            new DeleteStaffCommand(
                staffId,
                restaurantId,
                _currentUser.UserId!.Value), ct);

        return Ok(new { success = true, message = "Staff member removed" });
    }
}