using FoodBridge.Application.DTOs.Admin;
using MediatR;
namespace FoodBridge.Application.Features.Admin.Commands.UpdateCommission;

public record UpdateCommissionCommand(
    Guid CommissionId,
    decimal Rate,
    string Type,
    string? Notes)
    : IRequest<CommissionDto>;
