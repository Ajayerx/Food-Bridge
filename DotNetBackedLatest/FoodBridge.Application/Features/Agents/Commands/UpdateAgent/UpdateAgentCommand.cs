// UpdateAgentCommand.cs
using FoodBridge.Application.DTOs.Agents;
using MediatR;
namespace FoodBridge.Application.Features.Agents.Commands.UpdateAgent;

public record UpdateAgentCommand(
    Guid AgentId,
    string? FullName,
    string? Email,
    string? VehicleType,
    string? VehicleNumber,
    string? LicenseNumber)
    : IRequest<DeliveryAgentDto>;