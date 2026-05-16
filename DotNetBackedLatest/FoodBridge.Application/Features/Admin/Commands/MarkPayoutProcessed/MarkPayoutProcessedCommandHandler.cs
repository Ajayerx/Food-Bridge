using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Admin.Commands.MarkPayoutProcessed;

public class MarkPayoutProcessedCommandHandler : IRequestHandler<MarkPayoutProcessedCommand, Unit>
{
    private readonly IAppDbContext _db;
    public MarkPayoutProcessedCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(MarkPayoutProcessedCommand request, CancellationToken ct)
    {
        var payout = await _db.VendorPayouts
            .FirstOrDefaultAsync(p => p.Id == request.PayoutId, ct)
            ?? throw new NotFoundException($"Payout {request.PayoutId} not found.");

        payout.Status = PayoutStatus.Completed;
        payout.ProcessedAt = DateTime.UtcNow;
        if (request.TransactionId is not null) payout.TransactionId = request.TransactionId;
        if (request.Notes is not null) payout.Notes = request.Notes;

        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
