// DeleteAgentCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Agents.Commands.DeleteAgent;

public class DeleteAgentCommandHandler
    : IRequestHandler<DeleteAgentCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteAgentCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        DeleteAgentCommand request,
        CancellationToken ct)
    {
        var agent = await _db.DeliveryAgents
            .FirstOrDefaultAsync(
                a => a.Id == request.AgentId, ct)
            ?? throw new NotFoundException(
                "Delivery agent", request.AgentId);

        // Soft delete — set status to Banned/Inactive
        agent.Status = AgentStatus.Inactive;
        agent.IsAvailable = false;
        agent.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}