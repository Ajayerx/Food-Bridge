// ToggleAvailabilityCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Delivery.Commands.ToggleAvailability;

public class ToggleAvailabilityCommandHandler
    : IRequestHandler<ToggleAvailabilityCommand, Unit>
{
    private readonly IAppDbContext _db;

    public ToggleAvailabilityCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        ToggleAvailabilityCommand request,
        CancellationToken ct)
    {
        var agent = await _db.DeliveryAgents
            .FirstOrDefaultAsync(
                a => a.UserId == request.AgentUserId, ct)
            ?? throw new NotFoundException(
                "Delivery agent profile not found.");

        agent.IsAvailable = request.IsAvailable;
        agent.UpdatedAt = DateTime.UtcNow;

        if (request.CurrentLatitude.HasValue)
            agent.CurrentLatitude = request.CurrentLatitude;

        if (request.CurrentLongitude.HasValue)
            agent.CurrentLongitude = request.CurrentLongitude;

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}