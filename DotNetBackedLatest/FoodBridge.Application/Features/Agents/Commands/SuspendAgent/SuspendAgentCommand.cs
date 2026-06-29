using MediatR;

namespace FoodBridge.Application.Features.Agents.Commands.SuspendAgent;

public record SuspendAgentCommand(Guid AgentId, Guid AdminUserId, string? Reason = null) : IRequest<Unit>;
