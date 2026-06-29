using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Agents.Commands.RejectAgent;

public class RejectAgentCommandHandler
    : IRequestHandler<RejectAgentCommand, Unit>
{
    private readonly IAppDbContext _db;

    public RejectAgentCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(RejectAgentCommand request, CancellationToken ct)
    {
        var agent = await _db.DeliveryAgents
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == request.AgentId, ct)
            ?? throw new NotFoundException("Delivery agent not found.");

        if (agent.Status != AgentStatus.Pending)
            throw new BadRequestException(
                $"Agent is already {agent.Status.ToString().ToLowerInvariant()}.");

        agent.Status = AgentStatus.Rejected;

        var reason = request.Reason ?? "Your application did not meet our requirements.";

        _db.Notifications.Add(new Notification
        {
            UserId = agent.UserId,
            Title = "Agent Registration Rejected",
            Body = reason,
            Type = NotificationType.System,
            ActionUrl = null
        });

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = request.AdminUserId,
            Action = AuditAction.Update,
            EntityName = "DeliveryAgent",
            EntityId = agent.Id.ToString(),
            Details = $"Delivery agent '{agent.User.FullName ?? agent.User.MobileNumber}' rejected. Reason: {reason}"
        });

        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
