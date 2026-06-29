using MediatR;

namespace FoodBridge.Application.Features.Agents.Commands.ApproveAgent;

public record ApproveAgentCommand(Guid AgentId, Guid AdminUserId) : IRequest<Unit>;
