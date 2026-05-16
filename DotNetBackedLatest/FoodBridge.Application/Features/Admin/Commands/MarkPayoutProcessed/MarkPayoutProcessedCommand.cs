using MediatR;
namespace FoodBridge.Application.Features.Admin.Commands.MarkPayoutProcessed;

public record MarkPayoutProcessedCommand(
    Guid PayoutId,
    string? TransactionId,
    string? Notes)
    : IRequest<Unit>;
