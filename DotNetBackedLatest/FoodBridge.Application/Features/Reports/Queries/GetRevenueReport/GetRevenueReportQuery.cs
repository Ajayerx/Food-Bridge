// GetRevenueReportQuery.cs
using FoodBridge.Application.DTOs.Reports;
using MediatR;
namespace FoodBridge.Application.Features.Reports.Queries.GetRevenueReport;

public record GetRevenueReportQuery(
    Guid UserId,
    string? RoleType,
    Guid? RestaurantId,
    DateTime From,
    DateTime To,
    string GroupBy)
    : IRequest<RevenueReportDto>;