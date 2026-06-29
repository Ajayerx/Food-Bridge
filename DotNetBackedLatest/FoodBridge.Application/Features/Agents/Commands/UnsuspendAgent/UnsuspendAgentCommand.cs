using MediatR;

namespace FoodBridge.Application.Features.Agents.Commands.UnsuspendAgent;

public record UnsuspendAgentCommand(Guid AgentId, Guid AdminUserId) : IRequest<Unit>;
