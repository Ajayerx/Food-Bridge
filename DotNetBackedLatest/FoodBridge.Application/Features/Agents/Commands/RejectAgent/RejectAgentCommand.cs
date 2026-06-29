using MediatR;

namespace FoodBridge.Application.Features.Agents.Commands.RejectAgent;

public record RejectAgentCommand(Guid AgentId, Guid AdminUserId, string? Reason = null) : IRequest<Unit>;
