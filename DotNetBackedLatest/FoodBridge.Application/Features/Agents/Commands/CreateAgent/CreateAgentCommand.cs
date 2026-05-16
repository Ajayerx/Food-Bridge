// CreateAgentCommand.cs
using FoodBridge.Application.DTOs.Agents;
using MediatR;
namespace FoodBridge.Application.Features.Agents.Commands.CreateAgent;

public record CreateAgentCommand(
    string MobileNumber,
    string FullName,
    string? Email,
    string? VehicleType,
    string? VehicleNumber,
    string? LicenseNumber)
    : IRequest<DeliveryAgentDto>;