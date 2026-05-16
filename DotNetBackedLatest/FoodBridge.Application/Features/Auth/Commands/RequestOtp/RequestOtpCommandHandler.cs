// RequestOtpCommandHandler.cs
using FoodBridge.Application.Common.Interfaces;
using MediatR;
namespace FoodBridge.Application.Features.Auth.Commands.RequestOtp;

public class RequestOtpCommandHandler
    : IRequestHandler<RequestOtpCommand, RequestOtpResult>
{
    private readonly IOtpService _otpService;

    public RequestOtpCommandHandler(IOtpService otpService)
        => _otpService = otpService;

    public async Task<RequestOtpResult> Handle(
        RequestOtpCommand request,
        CancellationToken ct)
    {
        await _otpService.GenerateAndStoreOtpAsync(
            request.MobileNumber, ct);

        return new RequestOtpResult(true, "OTP sent successfully");
    }
}