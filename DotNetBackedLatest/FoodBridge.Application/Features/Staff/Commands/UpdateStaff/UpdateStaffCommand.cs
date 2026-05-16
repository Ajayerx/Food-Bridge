// UpdateStaffCommand.cs
using FoodBridge.Application.DTOs.Staff;
using MediatR;
namespace FoodBridge.Application.Features.Staff.Commands.UpdateStaff;

public record UpdateStaffCommand(
    Guid StaffId,
    Guid RestaurantId,
    Guid VendorUserId,
    string? FullName,
    string? Email,
    string? StaffRole)
    : IRequest<StaffUserDto>;