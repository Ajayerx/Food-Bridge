// GetTaskByIdQueryHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Delivery;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Delivery.Queries.GetTaskById;

public class GetTaskByIdQueryHandler
    : IRequestHandler<GetTaskByIdQuery, DeliveryTaskDto>
{
    private readonly IAppDbContext _db;

    public GetTaskByIdQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<DeliveryTaskDto> Handle(
        GetTaskByIdQuery request,
        CancellationToken ct)
    {
        var agent = await _db.DeliveryAgents
            .AsNoTracking()
            .FirstOrDefaultAsync(
                a => a.UserId == request.AgentUserId, ct)
            ?? throw new NotFoundException(
                "Delivery agent profile not found.");

        var t = await _db.DeliveryTasks
            .AsNoTracking()
            .Include(t => t.Order)
                .ThenInclude(o => o.Restaurant)
            .Include(t => t.Order)
                .ThenInclude(o => o.DeliveryAddress)
            .Include(t => t.Agent)
                .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(
                t => t.Id == request.TaskId
                  && t.AgentId == agent.Id, ct)
            ?? throw new NotFoundException(
                "Delivery task", request.TaskId);

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