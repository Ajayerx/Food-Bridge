// GetMyTasksQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Delivery;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Delivery.Queries.GetMyTasks;

public class GetMyTasksQueryHandler
    : IRequestHandler<GetMyTasksQuery, List<DeliveryTaskDto>>
{
    private readonly IAppDbContext _db;

    public GetMyTasksQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<DeliveryTaskDto>> Handle(
        GetMyTasksQuery request,
        CancellationToken ct)
    {
        var agent = await _db.DeliveryAgents
            .AsNoTracking()
            .FirstOrDefaultAsync(
                a => a.UserId == request.AgentUserId, ct);

        if (agent is null)
            return new List<DeliveryTaskDto>();

        var query = _db.DeliveryTasks
            .AsNoTracking()
            .Include(t => t.Order)
                .ThenInclude(o => o.Restaurant)
            .Include(t => t.Order)
                .ThenInclude(o => o.DeliveryAddress)
            .Include(t => t.Agent)
                .ThenInclude(a => a.User)
            .Where(t => t.AgentId == agent.Id);

        if (!string.IsNullOrEmpty(request.Status)
         && Enum.TryParse<DeliveryTaskStatus>(
                request.Status, out var status))
            query = query.Where(t => t.Status == status);

        var tasks = await query
            .OrderByDescending(t => t.AssignedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return tasks.Select(t => new DeliveryTaskDto
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
        }).ToList();
    }
}