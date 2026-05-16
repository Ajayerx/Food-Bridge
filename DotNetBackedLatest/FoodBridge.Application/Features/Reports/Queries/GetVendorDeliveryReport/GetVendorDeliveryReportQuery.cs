using FoodBridge.Application.DTOs.Reports;
using MediatR;
namespace FoodBridge.Application.Features.Reports.Queries.GetVendorDeliveryReport;
public record GetVendorDeliveryReportQuery(Guid UserId, string? RoleType, Guid? RestaurantId, DateTime From, DateTime To)
    : IRequest<VendorDeliveryReportDto>;
