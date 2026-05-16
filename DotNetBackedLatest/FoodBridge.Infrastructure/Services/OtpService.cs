using FoodBridge.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;
namespace FoodBridge.Infrastructure.Services;

public class OtpService : IOtpService
{
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _config;
    private readonly ISmsService _sms;

    public OtpService(
        IMemoryCache cache,
        IConfiguration config,
        ISmsService sms)
    {
        _cache = cache;
        _config = config;
        _sms = sms;
    }

    public async Task<string> GenerateAndStoreOtpAsync(
    string mobileNumber,
    CancellationToken ct = default)
    {
        var length = int.Parse(_config["Otp:Length"] ?? "6");
        var expiry = int.Parse(_config["Otp:ExpirySeconds"] ?? "300");

        // var otp = GenerateOtp(length);
        var otp = "123456";

        var key = $"otp:{mobileNumber}";

        var hash = BCrypt.Net.BCrypt.HashPassword(otp);

        // Store in MemoryCache
        _cache.Set(
            key,
            hash,
            TimeSpan.FromSeconds(expiry));

        Console.WriteLine($"Stored OTP in MemoryCache: {key}");

        // Store attempt count
        var attemptsKey = $"otp_attempts:{mobileNumber}";

        int attempts = 0;
        if (_cache.TryGetValue(attemptsKey, out int existingAttempts))
        {
            attempts = existingAttempts;
        }

        _cache.Set(
            attemptsKey,
            attempts + 1,
            TimeSpan.FromSeconds(expiry));

        // Send via SMS
        await _sms.SendOtpAsync(mobileNumber, otp, ct);

        return otp;
    }

    public async Task<bool> ValidateOtpAsync(
        string mobileNumber,
        string otp,
        CancellationToken ct = default)
    {
        var key = $"otp:{mobileNumber}";


        if (!_cache.TryGetValue(key, out string stored))
            return false;

        var isValid = BCrypt.Net.BCrypt.Verify(otp, stored);

        if (isValid)
        {

            _cache.Remove(key);
            _cache.Remove($"otp_attempts:{mobileNumber}");
        }

        return isValid;
    }

    private static string GenerateOtp(int length)
    {
        var random = new Random();
        return string.Concat(
            Enumerable.Range(0, length)
                .Select(_ => random.Next(0, 10).ToString()));
    }
}