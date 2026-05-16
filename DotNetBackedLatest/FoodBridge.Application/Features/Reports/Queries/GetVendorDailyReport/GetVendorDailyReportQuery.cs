using FoodBridge.Application.DTOs.Reports;
using MediatR;
namespace FoodBridge.Application.Features.Reports.Queries.GetVendorDailyReport;
public record GetVendorDailyReportQuery(Guid UserId, string? RoleType, Guid? RestaurantId, DateTime From, DateTime To)
    : IRequest<VendorDailyReportDto>;
