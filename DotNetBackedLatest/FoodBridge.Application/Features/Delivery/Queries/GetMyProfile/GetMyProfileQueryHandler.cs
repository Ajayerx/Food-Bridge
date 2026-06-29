using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Agents;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Delivery.Queries.GetMyProfile;

public class GetMyProfileQueryHandler
    : IRequestHandler<GetMyProfileQuery, DeliveryAgentDto>
{
    private readonly IAppDbContext _db;

    public GetMyProfileQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<DeliveryAgentDto> Handle(
        GetMyProfileQuery request,
        CancellationToken ct)
    {
        var a = await _db.DeliveryAgents
            .AsNoTracking()
            .Include(a => a.User)
            .FirstOrDefaultAsync(
                a => a.UserId == request.AgentUserId, ct)
            ?? throw new NotFoundException("Delivery agent profile not found.");

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
