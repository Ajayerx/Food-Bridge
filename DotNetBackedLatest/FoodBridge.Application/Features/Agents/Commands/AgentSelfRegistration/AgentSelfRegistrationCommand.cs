using FoodBridge.Application.DTOs.Agents;
using MediatR;

namespace FoodBridge.Application.Features.Agents.Commands.AgentSelfRegistration;

public record AgentSelfRegistrationCommand(
    string MobileNumber,
    string FullName,
    string? Email,
    string? VehicleType,
    string? VehicleNumber,
    string? LicenseNumber)
    : IRequest<DeliveryAgentDto>;
