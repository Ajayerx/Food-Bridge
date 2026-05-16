// HandlePaymentWebhookCommandHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
namespace FoodBridge.Application.Features.Payments.Commands.HandleWebhook;

public class HandlePaymentWebhookCommandHandler
    : IRequestHandler<HandlePaymentWebhookCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly IConfiguration _config;

    public HandlePaymentWebhookCommandHandler(
        IAppDbContext db,
        IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<Unit> Handle(
        HandlePaymentWebhookCommand request,
        CancellationToken ct)
    {
        // 1. Verify webhook signature
        var webhookSecret = _config["Razorpay:WebhookSecret"]!;
        var payloadJson = JsonSerializer.Serialize(request.Payload);
        var isValid = VerifySignature(
            payloadJson, request.Signature, webhookSecret);

        if (!isValid)
            return Unit.Value; // Ignore invalid signatures

        // 2. Parse payload
        var payload = JsonSerializer
            .Deserialize<JsonElement>(payloadJson);

        var rzpPaymentId = payload
            .GetProperty("payment")
            .GetProperty("entity")
            .GetProperty("id")
            .GetString();

        var rzpOrderId = payload
            .GetProperty("payment")
            .GetProperty("entity")
            .GetProperty("order_id")
            .GetString();

        // 3. Find payment record
        var payment = await _db.Payments
            .Include(p => p.Order)
            .FirstOrDefaultAsync(
                p => p.GatewayOrderId == rzpOrderId, ct);

        if (payment is null)
            return Unit.Value;

        // 4. Handle event
        switch (request.Event)
        {
            case "payment.captured":
                payment.Status = PaymentStatus.Captured;
                payment.GatewayPaymentId = rzpPaymentId;
                payment.CapturedAt = DateTime.UtcNow;
                payment.UpdatedAt = DateTime.UtcNow;

                // Update order payment status
                payment.Order.PaymentStatus = OrderPaymentStatus.Paid;
                payment.Order.OrderStatus = OrderStatus.Confirmed;
                payment.Order.UpdatedAt = DateTime.UtcNow;
                break;

            case "payment.failed":
                payment.Status = PaymentStatus.Failed;
                payment.FailureReason = payload
                    .GetProperty("payment")
                    .GetProperty("entity")
                    .GetProperty("error_description")
                    .GetString();
                payment.UpdatedAt = DateTime.UtcNow;

                payment.Order.PaymentStatus = OrderPaymentStatus.Failed;
                payment.Order.UpdatedAt = DateTime.UtcNow;
                break;
        }

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }

    private static bool VerifySignature(
        string payload,
        string signature,
        string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var msgBytes = Encoding.UTF8.GetBytes(payload);
        using var hmac = new HMACSHA256(keyBytes);
        var hash = hmac.ComputeHash(msgBytes);
        var computed = Convert.ToHexString(hash).ToLower();
        return computed == signature;
    }
}