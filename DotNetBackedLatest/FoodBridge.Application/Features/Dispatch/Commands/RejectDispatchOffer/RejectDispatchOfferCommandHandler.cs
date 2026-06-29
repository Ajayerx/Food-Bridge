using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Dispatch.Commands.RejectDispatchOffer;

public class RejectDispatchOfferCommandHandler
    : IRequestHandler<RejectDispatchOfferCommand, Unit>
{
    private readonly IAppDbContext _db;

    public RejectDispatchOfferCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<Unit> Handle(
        RejectDispatchOfferCommand request,
        CancellationToken ct)
    {
        var offer = await _db.DispatchOffers
            .FirstOrDefaultAsync(o => o.Id == request.OfferId, ct)
            ?? throw new NotFoundException("DispatchOffer", request.OfferId);

        if (offer.Status != DispatchOfferStatus.Pending)
            return Unit.Value;

        // Rejection by an individual agent doesn't expire the offer — it stays open for others.
        // We track this by logging a history entry or simply doing nothing.
        // The offer remains Pending until accepted or expired.

        return Unit.Value;
    }
}