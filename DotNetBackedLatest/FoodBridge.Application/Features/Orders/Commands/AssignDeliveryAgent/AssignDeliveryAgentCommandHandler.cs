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
    private const double MAX_DISPATCH_RADIUS_KM = 8.0;
    private const double EXPERIENCE_BONUS_PER_DELIVERY = 0.0005;
    private const double WEIGHT_RESTAURANT = 0.4;
    private const double WEIGHT_DELIVERY = 0.6;

    private readonly IAppDbContext _db;

    public AssignDeliveryAgentCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(AssignDeliveryAgentCommand request, CancellationToken ct)
    {
        var order = await _db.Orders
            .Include(o => o.DeliveryAddress)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct)
            ?? throw new NotFoundException("Order", request.OrderId);

        if (order.OrderType != OrderType.Delivery)
            throw new BadRequestException("Agent can only be assigned to delivery orders.");

        if (order.DeliveryAgentId != null)
            throw new BadRequestException("Order already has an agent assigned.");

        DeliveryAgent agent;

        if (request.AgentId.HasValue)
        {
            agent = await _db.DeliveryAgents
                .FirstOrDefaultAsync(a => a.Id == request.AgentId.Value
                    && a.IsAvailable == true
                    && a.Status == AgentStatus.Active, ct)
                ?? throw new BadRequestException("Agent is not available.");
        }
        else
        {
            var allAvailable = await _db.DeliveryAgents
                .Where(a => a.IsAvailable == true && a.Status == AgentStatus.Active)
                .ToListAsync(ct);

            if (allAvailable.Count == 0)
                throw new BadRequestException("No available delivery agents at the moment.");

            var restaurant = await _db.Restaurants
                .FirstOrDefaultAsync(r => r.Id == order.RestaurantId, ct);

            var customerLat = order.DeliveryAddress?.Latitude;
            var customerLng = order.DeliveryAddress?.Longitude;

            var withCoords = allAvailable
                .Where(a => a.CurrentLatitude != null && a.CurrentLongitude != null)
                .ToList();

            if (withCoords.Count > 0 && restaurant is not null)
            {
                // Score each agent by total route distance: Agent → Restaurant → Customer
                var candidates = withCoords
                    .Select(a => new
                    {
                        Agent = a,
                        DistToRestaurant = Haversine(
                            (double)a.CurrentLatitude!, (double)a.CurrentLongitude!,
                            (double)restaurant.Latitude, (double)restaurant.Longitude)
                    })
                    .Where(x => x.DistToRestaurant <= MAX_DISPATCH_RADIUS_KM)
                    .ToList();

                // If the radius filter emptied the list, use all withCoords
                if (candidates.Count == 0)
                {
                    candidates = withCoords
                        .Select(a => new
                        {
                            Agent = a,
                            DistToRestaurant = Haversine(
                                (double)a.CurrentLatitude!, (double)a.CurrentLongitude!,
                                (double)restaurant.Latitude, (double)restaurant.Longitude)
                        })
                        .ToList();
                }

                var hasCustomerCoords = customerLat.HasValue && customerLng.HasValue;

                agent = candidates
                    .OrderBy(x => CalculateRouteScore(
                        x.DistToRestaurant,
                        hasCustomerCoords
                            ? Haversine(
                                (double)restaurant.Latitude, (double)restaurant.Longitude,
                                (double)customerLat!, (double)customerLng!)
                            : 0,
                        hasCustomerCoords,
                        x.Agent.TotalDeliveries))
                    .First().Agent;
            }
            else
            {
                agent = allAvailable.OrderByDescending(a => a.TotalDeliveries).First();
            }
        }

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

    private static double CalculateRouteScore(
        double distToRestaurant,
        double distRestaurantToCustomer,
        bool hasCustomerCoords,
        int totalDeliveries)
    {
        double routeDistance;

        if (hasCustomerCoords)
        {
            routeDistance = (WEIGHT_RESTAURANT * distToRestaurant)
                          + (WEIGHT_DELIVERY * distRestaurantToCustomer);
        }
        else
        {
            routeDistance = distToRestaurant;
        }

        double experienceBonus = totalDeliveries * EXPERIENCE_BONUS_PER_DELIVERY;

        return Math.Max(0, routeDistance - experienceBonus);
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