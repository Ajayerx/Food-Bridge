using FoodBridge.Application.DTOs.Admin;
using MediatR;

namespace FoodBridge.Application.Features.Admin.Queries.GetAllVendors;

public record GetAllVendorsQuery(
    string? Status,
    string? Search,
    int Page,
    int PageSize)
    : IRequest<VendorListResult>;
