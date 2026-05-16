// HandlePaymentWebhookCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Payments.Commands.HandleWebhook;

public record HandlePaymentWebhookCommand(
    string Event,
    object? Payload,
    string Signature)
    : IRequest<Unit>;