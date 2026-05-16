using FoodBridge.Application.DTOs.Admin;
using MediatR;
namespace FoodBridge.Application.Features.Admin.Queries.GetCommissions;

public record GetCommissionsQuery(
    Guid? RestaurantId,
    DateTime? From,
    DateTime? To,
    int Page,
    int PageSize)
    : IRequest<GetCommissionsResult>;

public record GetCommissionsResult(List<CommissionDto> Items, int TotalCount);
