// UpdateTaskStatusCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Delivery.Commands.UpdateTaskStatus;

public class UpdateTaskStatusCommandHandler
    : IRequestHandler<UpdateTaskStatusCommand, Unit>
{
    private readonly IAppDbContext _db;

    public UpdateTaskStatusCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        UpdateTaskStatusCommand request,
        CancellationToken ct)
    {
        // 1. Get agent
        var agent = await _db.DeliveryAgents
            .FirstOrDefaultAsync(
                a => a.UserId == request.AgentUserId, ct)
            ?? throw new NotFoundException(
                "Delivery agent profile not found.");

        // 2. Get task
        var task = await _db.DeliveryTasks
            .Include(t => t.Order)
            .FirstOrDefaultAsync(
                t => t.Id == request.TaskId
                  && t.AgentId == agent.Id, ct)
            ?? throw new NotFoundException(
                "Delivery task", request.TaskId);

        var newStatus = Enum.Parse<DeliveryTaskStatus>(request.Status);

        // 3. Update task status
        task.Status = newStatus;
        task.Notes = request.Notes;
        task.UpdatedAt = DateTime.UtcNow;

        if (newStatus == DeliveryTaskStatus.PickedUp)
            task.PickedUpAt = DateTime.UtcNow;

        if (newStatus == DeliveryTaskStatus.Delivered)
        {
            task.DeliveredAt = DateTime.UtcNow;

            // Update order status
            task.Order.OrderStatus = OrderStatus.Delivered;
            task.Order.DeliveredAt = DateTime.UtcNow;
            task.Order.UpdatedAt = DateTime.UtcNow;

            // Free up agent
            agent.IsAvailable = true;
            agent.TotalDeliveries++;
            agent.UpdatedAt = DateTime.UtcNow;
        }

        if (newStatus == DeliveryTaskStatus.Failed)
        {
            // Free up agent
            agent.IsAvailable = true;
            agent.UpdatedAt = DateTime.UtcNow;
        }

        // 4. Update agent location
        if (request.CurrentLatitude.HasValue)
            agent.CurrentLatitude = request.CurrentLatitude;

        if (request.CurrentLongitude.HasValue)
            agent.CurrentLongitude = request.CurrentLongitude;

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}