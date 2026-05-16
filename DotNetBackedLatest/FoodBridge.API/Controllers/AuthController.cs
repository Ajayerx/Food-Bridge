using FoodBridge.Application.DTOs.Auth;
using FoodBridge.Application.Features.Auth.Commands.RequestOtp;
using FoodBridge.Application.Features.Auth.Commands.VerifyOtp;
using FoodBridge.Application.Features.Auth.Commands.RefreshToken;
using FoodBridge.Application.Features.Auth.Commands.Logout;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    /// <summary>POST v1/auth/request-otp</summary>
    [HttpPost("request-otp")]
    public async Task<IActionResult> RequestOtp(
        [FromBody] OtpRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(
            new RequestOtpCommand(dto.MobileNumber), ct);

        return Ok(new { success = true, message = "OTP sent successfully", data = result });
    }

    /// <summary>POST v1/auth/verify-otp</summary>
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp(
        [FromBody] OtpVerifyDto dto,
        CancellationToken ct)
    {
        
        var result = await _mediator.Send(
            new VerifyOtpCommand(dto.MobileNumber, dto.Otp, dto.DeviceInfo), ct);

        return Ok(new { success = true, message = "Login successful", data = result });
    }

    /// <summary>POST v1/auth/refresh</summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshRequestDto dto,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new RefreshTokenCommand(dto.RefreshToken), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/auth/logout</summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(
        [FromBody] RefreshRequestDto dto,
        CancellationToken ct)
    {
        await _mediator.Send(new LogoutCommand(dto.RefreshToken), ct);

        return Ok(new { success = true, message = "Logged out successfully" });
    }
}