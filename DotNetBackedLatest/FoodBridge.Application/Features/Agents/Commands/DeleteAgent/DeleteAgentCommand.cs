// DeleteAgentCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Agents.Commands.DeleteAgent;

public record DeleteAgentCommand(Guid AgentId)
    : IRequest<Unit>;