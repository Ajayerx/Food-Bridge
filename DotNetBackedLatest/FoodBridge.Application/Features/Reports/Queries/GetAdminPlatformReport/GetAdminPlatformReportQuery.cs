using FoodBridge.Application.DTOs.Reports;
using MediatR;
namespace FoodBridge.Application.Features.Reports.Queries.GetAdminPlatformReport;
public record GetAdminPlatformReportQuery(DateTime From, DateTime To) : IRequest<AdminPlatformReportDto>;
