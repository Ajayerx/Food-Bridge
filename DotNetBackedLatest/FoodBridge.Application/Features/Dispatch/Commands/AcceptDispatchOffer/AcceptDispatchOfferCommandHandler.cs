using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Dispatch.Commands.AcceptDispatchOffer;

public class AcceptDispatchOfferCommandHandler
    : IRequestHandler<AcceptDispatchOfferCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly IOrderNotificationService _notifications;

    public AcceptDispatchOfferCommandHandler(
        IAppDbContext db,
        IOrderNotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<Unit> Handle(
        AcceptDispatchOfferCommand request,
        CancellationToken ct)
    {
        var offer = await _db.DispatchOffers
            .Include(o => o.Order)
            .FirstOrDefaultAsync(o => o.Id == request.OfferId, ct)
            ?? throw new NotFoundException("DispatchOffer", request.OfferId);

        if (offer.Status != DispatchOfferStatus.Pending)
            throw new BadRequestException("Offer is no longer available.");

        if (offer.ExpiresAt <= DateTime.UtcNow)
        {
            offer.Status = DispatchOfferStatus.Expired;
            offer.CompletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            throw new BadRequestException("Offer has expired.");
        }

        // Find the delivery agent for this user
        var agent = await _db.DeliveryAgents
            .FirstOrDefaultAsync(a => a.UserId == request.AgentUserId, ct)
            ?? throw new NotFoundException("DeliveryAgent", request.AgentUserId);

        if (!agent.IsAvailable)
            throw new BadRequestException("You are not available to accept offers.");

        // Mark offer as accepted
        offer.Status = DispatchOfferStatus.Accepted;
        offer.AcceptedByAgentId = agent.Id;
        offer.CompletedAt = DateTime.UtcNow;

        // Assign agent to order
        var order = offer.Order;
        order.DeliveryAgentId = agent.Id;

        // Create delivery task
        var task = new DeliveryTask
        {
            OrderId = order.Id,
            AgentId = agent.Id,
            Status = DeliveryTaskStatus.Assigned,
            EarningsAmount = estimateEarnings(order.TotalAmount),
            AssignedAt = DateTime.UtcNow,
        };
        _db.DeliveryTasks.Add(task);

        // Mark agent unavailable
        agent.IsAvailable = false;

        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        // Broadcast to all agents that this offer was accepted
        await _notifications.NotifyDispatchOfferAccepted(offer.Id, order.Id, ct);

        return Unit.Value;
    }

    private static decimal estimateEarnings(decimal orderTotal)
    {
        return Math.Round(20 + orderTotal * 0.1m, 2);
    }
}