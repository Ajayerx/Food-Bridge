// AssignDeliveryAgentCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Orders.Commands.AssignDeliveryAgent;

public record AssignDeliveryAgentCommand(
    Guid OrderId,
    Guid? AgentId)  
    : IRequest<Unit>;