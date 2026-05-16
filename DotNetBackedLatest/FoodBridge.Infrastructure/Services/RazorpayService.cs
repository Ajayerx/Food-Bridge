using Microsoft.Extensions.Configuration;
using Razorpay.Api;

namespace FoodBridge.Infrastructure.Services;

public class RazorpayService
{
    private readonly RazorpayClient _client;
    private readonly string _webhookSecret;

    public RazorpayService(IConfiguration config)
    {
        _client = new RazorpayClient(
            config["Razorpay:KeyId"]!,
            config["Razorpay:KeySecret"]!);

        _webhookSecret = config["Razorpay:WebhookSecret"]!;
    }

    public Razorpay.Api.Order CreateOrder(
        decimal amount,
        string currency,
        string receipt,
        Dictionary<string, string>? notes = null)
    {
        var options = new Dictionary<string, object>
        {
            { "amount",   (int)(amount * 100) },
            { "currency", currency },
            { "receipt",  receipt }
        };

        if (notes?.Any() == true)
            options["notes"] = notes;

        return _client.Order.Create(options);
    }

    public bool VerifyWebhookSignature(
        string payload,
        string signature)
    {
        try
        {
            Utils.verifyWebhookSignature(
                payload,
                signature,
                _webhookSecret);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public bool VerifyPaymentSignature(
        string razorpayOrderId,
        string razorpayPaymentId,
        string razorpaySignature)
    {
        try
        {
            var attributes = new Dictionary<string, string>
            {
                { "razorpay_order_id",   razorpayOrderId },
                { "razorpay_payment_id", razorpayPaymentId },
                { "razorpay_signature",  razorpaySignature }
            };

            Utils.verifyPaymentSignature(attributes);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public Payment FetchPayment(string paymentId)
        => _client.Payment.Fetch(paymentId);

    public Refund RefundPayment(
        string paymentId,
        decimal amount)
    {
        var options = new Dictionary<string, object>
        {
            { "amount", (int)(amount * 100) },
            {  "paymentId", paymentId  }
        };

        return _client.Payment.Refund(options);
    }
}