// DeleteStaffCommand.cs
using MediatR;
namespace FoodBridge.Application.Features.Staff.Commands.DeleteStaff;

public record DeleteStaffCommand(
    Guid StaffId,
    Guid RestaurantId,
    Guid VendorUserId)
    : IRequest<Unit>;