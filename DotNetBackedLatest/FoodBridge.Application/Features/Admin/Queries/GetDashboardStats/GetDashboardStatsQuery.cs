// GetDashboardStatsQuery.cs
using FoodBridge.Application.DTOs.Admin;
using MediatR;
namespace FoodBridge.Application.Features.Admin.Queries.GetDashboardStats;

public record GetDashboardStatsQuery(
    DateTime From,
    DateTime To)
    : IRequest<DashboardStatsDto>;