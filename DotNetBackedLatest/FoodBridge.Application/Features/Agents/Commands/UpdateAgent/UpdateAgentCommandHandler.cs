// UpdateAgentCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Agents;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Agents.Commands.UpdateAgent;

public class UpdateAgentCommandHandler
    : IRequestHandler<UpdateAgentCommand, DeliveryAgentDto>
{
    private readonly IAppDbContext _db;

    public UpdateAgentCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<DeliveryAgentDto> Handle(
        UpdateAgentCommand request,
        CancellationToken ct)
    {
        var agent = await _db.DeliveryAgents
            .Include(a => a.User)
            .FirstOrDefaultAsync(
                a => a.Id == request.AgentId, ct)
            ?? throw new NotFoundException(
                "Delivery agent", request.AgentId);

        // Update user fields
        if (request.FullName is not null)
        {
            agent.User.FullName = request.FullName;
            agent.User.UpdatedAt = DateTime.UtcNow;
        }

        if (request.Email is not null)
        {
            agent.User.Email = request.Email;
            agent.User.UpdatedAt = DateTime.UtcNow;
        }

        // Update agent fields
        if (request.VehicleType is not null)
            agent.VehicleType = request.VehicleType;

        if (request.VehicleNumber is not null)
            agent.VehicleNumber = request.VehicleNumber;

        if (request.LicenseNumber is not null)
            agent.LicenseNumber = request.LicenseNumber;

        agent.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return new DeliveryAgentDto
        {
            Id = agent.Id,
            UserId = agent.UserId,
            FullName = agent.User.FullName ?? string.Empty,
            MobileNumber = agent.User.MobileNumber,
            Email = agent.User.Email,
            AvatarUrl = agent.User.AvatarUrl,
            VehicleType = agent.VehicleType,
            VehicleNumber = agent.VehicleNumber,
            LicenseNumber = agent.LicenseNumber,
            Status = agent.Status.ToString(),
            IsAvailable = agent.IsAvailable,
            TotalEarnings = agent.TotalEarnings,
            TotalDeliveries = agent.TotalDeliveries,
            CreatedAt = agent.CreatedAt
        };
    }
}