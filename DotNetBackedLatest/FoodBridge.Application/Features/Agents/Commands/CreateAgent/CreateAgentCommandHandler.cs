// CreateAgentCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Agents;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Agents.Commands.CreateAgent;

public class CreateAgentCommandHandler
    : IRequestHandler<CreateAgentCommand, DeliveryAgentDto>
{
    private readonly IAppDbContext _db;

    public CreateAgentCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<DeliveryAgentDto> Handle(
        CreateAgentCommand request,
        CancellationToken ct)
    {
        // 1. Check mobile not already registered
        var existingUser = await _db.Users
            .FirstOrDefaultAsync(
                u => u.MobileNumber == request.MobileNumber
                  && u.DeletedAt == null, ct);

        if (existingUser is not null)
        {
            // Check not already an agent
            var alreadyAgent = await _db.DeliveryAgents
                .AnyAsync(
                    a => a.UserId == existingUser.Id, ct);

            if (alreadyAgent)
                throw new BadRequestException(
                    "This mobile number is already registered as a delivery agent.");
        }

        // 2. Create user account
        var user = existingUser ?? new User
        {
            MobileNumber = request.MobileNumber,
            FullName = request.FullName,
            Email = request.Email,
            Role = UserRole.DeliveryAgent,
            Status = UserStatus.Active
        };

        if (existingUser is null)
            _db.Users.Add(user);

        // 3. Create agent profile
        var agent = new DeliveryAgent
        {
            UserId = user.Id,
            VehicleType = request.VehicleType,
            VehicleNumber = request.VehicleNumber,
            LicenseNumber = request.LicenseNumber,
            Status = AgentStatus.Active,
            IsAvailable = false
        };

        _db.DeliveryAgents.Add(agent);
        await _db.SaveChangesAsync(ct);

        return new DeliveryAgentDto
        {
            Id = agent.Id,
            UserId = user.Id,
            FullName = user.FullName ?? string.Empty,
            MobileNumber = user.MobileNumber,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
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