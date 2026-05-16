using MediatR;

namespace FoodBridge.Application.Features.Orders.Commands.SettleBill;

public record SettleBillCommand(
    Guid OrderId,
    string PaymentMethod  // "Online" or "COD"
) : IRequest<Unit>;