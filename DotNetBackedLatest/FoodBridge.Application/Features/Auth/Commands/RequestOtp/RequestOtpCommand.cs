// RequestOtpCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Auth.Commands.RequestOtp;

public record RequestOtpCommand(string MobileNumber)
    : IRequest<RequestOtpResult>;

public record RequestOtpResult(bool Sent, string Message);