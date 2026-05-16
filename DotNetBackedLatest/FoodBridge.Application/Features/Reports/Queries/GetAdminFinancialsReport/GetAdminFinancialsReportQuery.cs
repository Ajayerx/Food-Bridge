using FoodBridge.Application.DTOs.Reports;
using MediatR;
namespace FoodBridge.Application.Features.Reports.Queries.GetAdminFinancialsReport;
public record GetAdminFinancialsReportQuery(DateTime From, DateTime To, string GroupBy = "day")
    : IRequest<AdminFinancialsReportDto>;
