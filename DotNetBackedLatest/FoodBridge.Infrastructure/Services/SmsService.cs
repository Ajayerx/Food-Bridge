using FoodBridge.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace FoodBridge.Infrastructure.Services;

public interface ISmsService
{
    Task SendOtpAsync(
        string mobileNumber,
        string otp,
        CancellationToken ct = default);

    Task SendSmsAsync(
        string mobileNumber,
        string message,
        CancellationToken ct = default);
}

public class SmsService : ISmsService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmsService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public SmsService(
        IConfiguration config,
        ILogger<SmsService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _config = config;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task SendOtpAsync(
        string mobileNumber,
        string otp,
        CancellationToken ct = default)
    {
        var provider = _config["Sms:Provider"] ?? "Log";

        // In development — just log OTP
        if (provider == "Log"
         || string.IsNullOrEmpty(_config["Sms:ApiKey"]))
        {
            _logger.LogInformation(
                "OTP for {Mobile}: {Otp}",
                mobileNumber, otp);
            return;
        }

        await SendViaMSG91Async(mobileNumber, otp, ct);
    }

    public async Task SendSmsAsync(
        string mobileNumber,
        string message,
        CancellationToken ct = default)
    {
        var provider = _config["Sms:Provider"] ?? "Log";

        if (provider == "Log")
        {
            _logger.LogInformation(
                "SMS to {Mobile}: {Message}",
                mobileNumber, message);
            return;
        }

        await SendViaMSG91Async(mobileNumber, message, ct);
    }

    private async Task SendViaMSG91Async(
        string mobileNumber,
        string message,
        CancellationToken ct)
    {
        try
        {
            var apiKey = _config["Sms:ApiKey"]!;
            var senderId = _config["Sms:SenderId"] ?? "FDBRDG";
            var templateId = _config["Sms:TemplateId"];

            var client = _httpClientFactory.CreateClient("MSG91");

            var payload = new
            {
                template_id = templateId,
                sender = senderId,
                short_url = "0",
                mobiles = $"91{mobileNumber}",
                otp = message
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json");

            client.DefaultRequestHeaders
                .TryAddWithoutValidation("authkey", apiKey);

            var response = await client.PostAsync(
                "https://api.msg91.com/api/v5/otp",
                content,
                ct);

            if (!response.IsSuccessStatusCode)
                _logger.LogWarning(
                    "SMS failed for {Mobile}. Status: {Status}",
                    mobileNumber,
                    response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "SMS send failed for {Mobile}", mobileNumber);
        }
    }
}