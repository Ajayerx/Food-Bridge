using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Agents.Commands.ApproveAgent;

public class ApproveAgentCommandHandler
    : IRequestHandler<ApproveAgentCommand, Unit>
{
    private readonly IAppDbContext _db;

    public ApproveAgentCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(ApproveAgentCommand request, CancellationToken ct)
    {
        var agent = await _db.DeliveryAgents
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == request.AgentId, ct)
            ?? throw new NotFoundException("Delivery agent not found.");

        if (agent.Status != AgentStatus.Pending)
            throw new BadRequestException(
                $"Agent is already {agent.Status.ToString().ToLowerInvariant()}.");

        agent.Status = AgentStatus.Active;

        _db.Notifications.Add(new Notification
        {
            UserId = agent.UserId,
            Title = "Agent Approved",
            Body = "Your delivery agent profile has been approved. You can now log in and start receiving delivery offers.",
            Type = NotificationType.System,
            ActionUrl = "/delivery/login"
        });

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = request.AdminUserId,
            Action = AuditAction.Update,
            EntityName = "DeliveryAgent",
            EntityId = agent.Id.ToString(),
            Details = $"Delivery agent '{agent.User.FullName ?? agent.User.MobileNumber}' approved."
        });

        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
