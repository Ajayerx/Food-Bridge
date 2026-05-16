// GetAgentByIdQueryHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Agents;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Agents.Queries.GetAgentById;

public class GetAgentByIdQueryHandler
    : IRequestHandler<GetAgentByIdQuery, DeliveryAgentDto>
{
    private readonly IAppDbContext _db;

    public GetAgentByIdQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<DeliveryAgentDto> Handle(
        GetAgentByIdQuery request,
        CancellationToken ct)
    {
        var a = await _db.DeliveryAgents
            .AsNoTracking()
            .Include(a => a.User)
            .FirstOrDefaultAsync(
                a => a.Id == request.AgentId, ct)
            ?? throw new NotFoundException(
                "Delivery agent", request.AgentId);

        return new DeliveryAgentDto
        {
            Id = a.Id,
            UserId = a.UserId,
            FullName = a.User.FullName ?? string.Empty,
            MobileNumber = a.User.MobileNumber,
            Email = a.User.Email,
            AvatarUrl = a.User.AvatarUrl,
            VehicleType = a.VehicleType,
            VehicleNumber = a.VehicleNumber,
            LicenseNumber = a.LicenseNumber,
            Status = a.Status.ToString(),
            IsAvailable = a.IsAvailable,
            CurrentLatitude = a.CurrentLatitude,
            CurrentLongitude = a.CurrentLongitude,
            TotalEarnings = a.TotalEarnings,
            TotalDeliveries = a.TotalDeliveries,
            CreatedAt = a.CreatedAt
        };
    }
}