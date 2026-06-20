using FoodBridge.Application.DTOs.VendorRegistration;
using FoodBridge.Application.Features.VendorRegistration.Commands.RegisterVendor;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/vendor")]
public class VendorRegistrationController : ControllerBase
{
    private readonly IMediator _mediator;

    public VendorRegistrationController(IMediator mediator)
        => _mediator = mediator;

    /// <summary>POST v1/vendor/register — Public, no auth required (new vendor sign-up)</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] VendorRegisterRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new RegisterVendorCommand(
                dto.MobileNumber, dto.FullName, dto.Email, dto.BusinessName,
                dto.GstNumber, dto.PanNumber, dto.BankAccountNumber,
                dto.BankIfscCode, dto.BankHolderName,
                dto.RestaurantName, dto.Description, dto.Cuisines, dto.Address,
                dto.City, dto.State, dto.PinCode, dto.Latitude, dto.Longitude,
                dto.IsPureVeg, dto.FssaiLicense,
                dto.PhoneNumber, dto.DeliveryFee, dto.MinOrderAmount,
                dto.AvgPrepMinutes, dto.IsDineInEnabled, dto.IsTakeawayEnabled,
                dto.IsDeliveryEnabled, dto.OperatingHours), ct);
        return Ok(new { success = true, data = result, message = "Vendor registered. Pending admin approval." });
    }
}
