namespace FoodBridge.Application.Common.Interfaces;

public interface IOtpService
{
    Task<string> GenerateAndStoreOtpAsync(
        string mobileNumber,
        CancellationToken ct = default);

    Task<bool> ValidateOtpAsync(
        string mobileNumber,
        string otp,
        CancellationToken ct = default);
}