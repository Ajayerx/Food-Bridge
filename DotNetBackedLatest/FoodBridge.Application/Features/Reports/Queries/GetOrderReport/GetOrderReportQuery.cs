// GetOrderReportQuery.cs
using FoodBridge.Application.DTOs.Reports;
using MediatR;
namespace FoodBridge.Application.Features.Reports.Queries.GetOrderReport;

public record GetOrderReportQuery(
    Guid UserId,
    string? RoleType,
    Guid? RestaurantId,
    DateTime From,
    DateTime To,
    string? Status)
    : IRequest<OrderReportDto>;