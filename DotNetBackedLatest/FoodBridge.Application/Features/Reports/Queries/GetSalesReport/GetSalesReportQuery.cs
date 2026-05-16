// GetSalesReportQuery.cs
using FoodBridge.Application.DTOs.Reports;
using MediatR;
namespace FoodBridge.Application.Features.Reports.Queries.GetSalesReport;

public record GetSalesReportQuery(
    Guid UserId,
    string? RoleType,
    Guid? RestaurantId,
    DateTime From,
    DateTime To,
    string GroupBy)
    : IRequest<SalesReportDto>;