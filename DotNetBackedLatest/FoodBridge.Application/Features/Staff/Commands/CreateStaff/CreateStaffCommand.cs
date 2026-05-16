// CreateStaffCommand.cs
using FoodBridge.Application.DTOs.Staff;
using MediatR;
namespace FoodBridge.Application.Features.Staff.Commands.CreateStaff;

public record CreateStaffCommand(
    Guid RestaurantId,
    Guid VendorUserId,
    string MobileNumber,
    string FullName,
    string? Email,
    string StaffRole)
    : IRequest<StaffUserDto>;