// VerifyOtpCommand.cs
using FoodBridge.Application.DTOs.Auth;
using MediatR;
namespace FoodBridge.Application.Features.Auth.Commands.VerifyOtp;

public record VerifyOtpCommand(
    string MobileNumber,
    string Otp,
    string? DeviceInfo)
    : IRequest<VerifyOtpResponseDto>;