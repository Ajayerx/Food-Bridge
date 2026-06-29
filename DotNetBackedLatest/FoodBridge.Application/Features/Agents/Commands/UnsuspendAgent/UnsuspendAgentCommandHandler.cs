using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Agents.Commands.UnsuspendAgent;

public class UnsuspendAgentCommandHandler
    : IRequestHandler<UnsuspendAgentCommand, Unit>
{
    private readonly IAppDbContext _db;

    public UnsuspendAgentCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(UnsuspendAgentCommand request, CancellationToken ct)
    {
        var agent = await _db.DeliveryAgents
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == request.AgentId, ct)
            ?? throw new NotFoundException("Delivery agent not found.");

        if (agent.Status != AgentStatus.Inactive)
            throw new BadRequestException(
                $"Agent is {agent.Status.ToString().ToLowerInvariant()}. Only suspended agents can be unsuspended.");

        agent.Status = AgentStatus.Active;
        agent.User.Status = UserStatus.Active;

        _db.Notifications.Add(new Notification
        {
            UserId = agent.UserId,
            Title = "Account Reinstated",
            Body = "Your delivery agent account has been reinstated. You can now log in and accept deliveries.",
            Type = NotificationType.System,
            ActionUrl = "/delivery/login"
        });

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = request.AdminUserId,
            Action = AuditAction.Update,
            EntityName = "DeliveryAgent",
            EntityId = agent.Id.ToString(),
            Details = $"Delivery agent '{agent.User.FullName ?? agent.User.MobileNumber}' unsuspended."
        });

        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
