using FoodBridge.Application.DTOs.Admin;
using MediatR;
namespace FoodBridge.Application.Features.Admin.Queries.GetPayouts;

public record GetPayoutsQuery(
    string? Status,
    Guid? VendorId,
    int Page,
    int PageSize)
    : IRequest<GetPayoutsResult>;

public record GetPayoutsResult(List<PayoutDto> Items, int TotalCount);
