using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Orders.Commands.AssignDeliveryAgent;

public class AssignDeliveryAgentCommandHandler
    : IRequestHandler<AssignDeliveryAgentCommand, Unit>
{
    private readonly IAppDbContext _db;

    public AssignDeliveryAgentCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(AssignDeliveryAgentCommand request, CancellationToken ct)
    {
        var order = await _db.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct)
            ?? throw new NotFoundException("Order", request.OrderId);

        if (order.OrderType != OrderType.Delivery)
            throw new BadRequestException("Agent can only be assigned to delivery orders.");

        if (order.DeliveryAgentId != null)
            throw new BadRequestException("Order already has an agent assigned.");

        DeliveryAgent agent;

        if (request.AgentId.HasValue)
        {
            // Manual assignment
            agent = await _db.DeliveryAgents
                .FirstOrDefaultAsync(a => a.Id == request.AgentId.Value
                    && a.IsAvailable == true
                    && a.Status == AgentStatus.Active, ct)
                ?? throw new BadRequestException("Agent is not available.");
        }
        else
        {
            // Auto-assign: fetch all available agents, use coordinates if available
            var allAvailable = await _db.DeliveryAgents
                .Where(a => a.IsAvailable == true && a.Status == AgentStatus.Active)
                .ToListAsync(ct);

            if (!allAvailable.Any())
                throw new BadRequestException("No available delivery agents at the moment.");

            var restaurant = await _db.Restaurants
                .FirstOrDefaultAsync(r => r.Id == order.RestaurantId, ct);

            var withCoords = allAvailable
                .Where(a => a.CurrentLatitude != null && a.CurrentLongitude != null)
                .ToList();

            agent = withCoords.Any() && restaurant?.Latitude != null && restaurant?.Longitude != null
                ? withCoords.OrderBy(a => Haversine(
                    (double)restaurant.Latitude, (double)restaurant.Longitude,
                    (double)a.CurrentLatitude!, (double)a.CurrentLongitude!)).First()
                : allAvailable.OrderByDescending(a => a.TotalDeliveries).First();
        }

        // Create delivery task
        _db.DeliveryTasks.Add(new DeliveryTask
        {
            OrderId = order.Id,
            AgentId = agent.Id,
            Status = DeliveryTaskStatus.Assigned,
            AssignedAt = DateTime.UtcNow
        });

        order.DeliveryAgentId = agent.Id;
        order.UpdatedAt = DateTime.UtcNow;

        agent.IsAvailable = false;
        agent.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }

    private static double Haversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double ToRad(double deg) => deg * Math.PI / 180;
}