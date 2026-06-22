using FoodBridge.Application.DTOs.Reports;
using MediatR;
namespace FoodBridge.Application.Features.Reports.Queries.GetAdminVendorsReport;
public record GetAdminVendorsReportQuery(DateTime From, DateTime To, int Limit = 20, int PageNumber = 1, int PageSize = 20) : IRequest<AdminVendorsReportDto>;
