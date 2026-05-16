// GetStaffListQuery.cs
using FoodBridge.Application.DTOs.Staff;
using MediatR;
namespace FoodBridge.Application.Features.Staff.Queries.GetStaffList;

public record GetStaffListQuery(
    Guid RestaurantId,
    Guid VendorUserId,
    int Page,
    int PageSize)
    : IRequest<List<StaffUserDto>>;