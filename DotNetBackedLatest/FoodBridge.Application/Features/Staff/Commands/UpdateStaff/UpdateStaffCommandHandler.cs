// UpdateStaffCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Staff;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Staff.Commands.UpdateStaff;

public class UpdateStaffCommandHandler
    : IRequestHandler<UpdateStaffCommand, StaffUserDto>
{
    private readonly IAppDbContext _db;

    public UpdateStaffCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<StaffUserDto> Handle(
        UpdateStaffCommand request,
        CancellationToken ct)
    {
        // 1. Verify vendor owns restaurant
        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(
                v => v.UserId == request.VendorUserId, ct)
            ?? throw new NotFoundException(
                "Vendor profile not found.");

        var restaurant = await _db.Restaurants
            .FirstOrDefaultAsync(
                r => r.Id == request.RestaurantId
                  && r.VendorId == vendor.Id, ct)
            ?? throw new NotFoundException(
                "Restaurant", request.RestaurantId);

        // 2. Get staff record
        var staff = await _db.StaffUsers
            .Include(s => s.User)
            .FirstOrDefaultAsync(
                s => s.Id == request.StaffId
                  && s.RestaurantId == request.RestaurantId
                  && s.IsActive == true, ct)
            ?? throw new NotFoundException(
                "Staff member", request.StaffId);

        // 3. Update user fields
        if (request.FullName is not null)
        {
            staff.User.FullName = request.FullName;
            staff.User.UpdatedAt = DateTime.UtcNow;
        }

        if (request.Email is not null)
        {
            staff.User.Email = request.Email;
            staff.User.UpdatedAt = DateTime.UtcNow;
        }

        // 4. Update staff role
        if (request.StaffRole is not null)
        {
            staff.StaffRole = Enum.Parse<StaffRole>(request.StaffRole);
            staff.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        return new StaffUserDto
        {
            Id = staff.Id,
            UserId = staff.UserId,
            FullName = staff.User.FullName ?? string.Empty,
            MobileNumber = staff.User.MobileNumber,
            Email = staff.User.Email,
            AvatarUrl = staff.User.AvatarUrl,
            RestaurantId = staff.RestaurantId,
            RestaurantName = restaurant.Name,
            StaffRole = staff.StaffRole.ToString(),
            IsActive = staff.IsActive,
            CreatedAt = staff.CreatedAt
        };
    }
}