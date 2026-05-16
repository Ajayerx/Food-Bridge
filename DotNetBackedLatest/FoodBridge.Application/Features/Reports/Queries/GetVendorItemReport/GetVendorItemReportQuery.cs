using FoodBridge.Application.DTOs.Reports;
using MediatR;
namespace FoodBridge.Application.Features.Reports.Queries.GetVendorItemReport;
public record GetVendorItemReportQuery(Guid UserId, string? RoleType, Guid? RestaurantId, DateTime From, DateTime To, int Limit = 20)
    : IRequest<VendorItemReportDto>;
