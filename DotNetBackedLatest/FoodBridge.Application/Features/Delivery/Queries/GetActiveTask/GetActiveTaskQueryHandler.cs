using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Delivery;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Delivery.Queries.GetActiveTask;

public class GetActiveTaskQueryHandler
    : IRequestHandler<GetActiveTaskQuery, DeliveryTaskDto?>
{
    private readonly IAppDbContext _db;

    public GetActiveTaskQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<DeliveryTaskDto?> Handle(
        GetActiveTaskQuery request,
        CancellationToken ct)
    {
        var agent = await _db.DeliveryAgents
            .AsNoTracking()
            .FirstOrDefaultAsync(
                a => a.UserId == request.AgentUserId, ct);

        if (agent is null)
            return null;

        var activeStatuses = new[]
        {
            DeliveryTaskStatus.Assigned,
            DeliveryTaskStatus.PickedUp
        };

        var t = await _db.DeliveryTasks
            .AsNoTracking()
            .Include(t => t.Order)
                .ThenInclude(o => o.Restaurant)
            .Include(t => t.Order)
                .ThenInclude(o => o.DeliveryAddress)
            .Include(t => t.Agent)
                .ThenInclude(a => a.User)
            .Where(t => t.AgentId == agent.Id
                     && activeStatuses.Contains(t.Status))
            .OrderByDescending(t => t.AssignedAt)
            .FirstOrDefaultAsync(ct);

        if (t is null)
            return null;

        return new DeliveryTaskDto
        {
            Id = t.Id,
            OrderId = t.OrderId,
            OrderCode = t.Order.OrderCode,
            AgentId = t.AgentId,
            AgentName = t.Agent.User.FullName ?? string.Empty,
            AgentMobile = t.Agent.User.MobileNumber,
            Status = t.Status.ToString(),
            RestaurantName = t.Order.Restaurant.Name,
            RestaurantAddress = t.Order.Restaurant.AddressLine,
            RestaurantLat = t.Order.Restaurant.Latitude,
            RestaurantLng = t.Order.Restaurant.Longitude,
            DeliveryAddress = t.Order.DeliveryAddress != null
                                    ? t.Order.DeliveryAddress.AddressLine1
                                    : string.Empty,
            DeliveryLat = t.Order.DeliveryAddress?.Latitude ?? 0,
            DeliveryLng = t.Order.DeliveryAddress?.Longitude ?? 0,
            EarningsAmount = t.EarningsAmount,
            Notes = t.Notes,
            AssignedAt = t.AssignedAt,
            PickedUpAt = t.PickedUpAt,
            DeliveredAt = t.DeliveredAt
        };
    }
}
