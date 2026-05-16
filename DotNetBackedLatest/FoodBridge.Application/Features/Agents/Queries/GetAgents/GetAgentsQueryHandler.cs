// GetAgentsQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Agents;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Agents.Queries.GetAgents;

public class GetAgentsQueryHandler
    : IRequestHandler<GetAgentsQuery, List<DeliveryAgentDto>>
{
    private readonly IAppDbContext _db;

    public GetAgentsQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<DeliveryAgentDto>> Handle(
        GetAgentsQuery request,
        CancellationToken ct)
    {
        var query = _db.DeliveryAgents
            .AsNoTracking()
            .Include(a => a.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.Status)
         && Enum.TryParse<AgentStatus>(
                request.Status, out var status))
            query = query.Where(a => a.Status == status);

        if (request.AvailableOnly)
            query = query.Where(a => a.IsAvailable == true);

        var agents = await query
            .OrderByDescending(a => a.TotalDeliveries)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return agents.Select(a => new DeliveryAgentDto
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
        }).ToList();
    }
}