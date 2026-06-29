using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Agents.Commands.SuspendAgent;

public class SuspendAgentCommandHandler
    : IRequestHandler<SuspendAgentCommand, Unit>
{
    private readonly IAppDbContext _db;

    public SuspendAgentCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(SuspendAgentCommand request, CancellationToken ct)
    {
        var agent = await _db.DeliveryAgents
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == request.AgentId, ct)
            ?? throw new NotFoundException("Delivery agent not found.");

        if (agent.Status != AgentStatus.Active)
            throw new BadRequestException(
                $"Agent is {agent.Status.ToString().ToLowerInvariant()}. Only active agents can be suspended.");

        agent.Status = AgentStatus.Inactive;
        agent.User.Status = UserStatus.Inactive;
        agent.IsAvailable = false;

        var reason = request.Reason ?? "No reason provided.";

        _db.Notifications.Add(new Notification
        {
            UserId = agent.UserId,
            Title = "Account Suspended",
            Body = $"Your delivery agent account has been suspended. Reason: {reason}",
            Type = NotificationType.System,
            ActionUrl = null
        });

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = request.AdminUserId,
            Action = AuditAction.Update,
            EntityName = "DeliveryAgent",
            EntityId = agent.Id.ToString(),
            Details = $"Delivery agent '{agent.User.FullName ?? agent.User.MobileNumber}' suspended. Reason: {reason}"
        });

        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
