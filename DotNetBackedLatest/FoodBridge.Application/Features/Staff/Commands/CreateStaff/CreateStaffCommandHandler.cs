// CreateStaffCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Staff;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Staff.Commands.CreateStaff;

public class CreateStaffCommandHandler
    : IRequestHandler<CreateStaffCommand, StaffUserDto>
{
    private readonly IAppDbContext _db;

    public CreateStaffCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<StaffUserDto> Handle(
        CreateStaffCommand request,
        CancellationToken ct)
    {
        // 1. Verify restaurant belongs to vendor
        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(
                v => v.UserId == request.VendorUserId, ct)
            ?? throw new NotFoundException(
                "Vendor profile not found.");

        var restaurant = await _db.Restaurants
            .FirstOrDefaultAsync(
                r => r.Id == request.RestaurantId
                  && r.VendorId == vendor.Id
                  && r.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "Restaurant", request.RestaurantId);

        // 2. Check if mobile already registered
        var existingUser = await _db.Users
            .FirstOrDefaultAsync(
                u => u.MobileNumber == request.MobileNumber
                  && u.DeletedAt == null, ct);

        User user;

        if (existingUser is null)
        {
            // 3a. Create new user account
            user = new User
            {
                MobileNumber = request.MobileNumber,
                FullName = request.FullName,
                Email = request.Email,
                Role = UserRole.Staff,
                Status = UserStatus.Active
            };
            _db.Users.Add(user);
        }
        else
        {
            // 3b. Use existing user
            user = existingUser;

            // Check not already staff at this restaurant
            var alreadyStaff = await _db.StaffUsers
                .AnyAsync(
                    s => s.UserId == user.Id
                      && s.RestaurantId == request.RestaurantId
                      && s.IsActive == true, ct);

            if (alreadyStaff)
                throw new BadRequestException(
                    "This user is already a staff member at this restaurant.");
        }

        // 4. Create staff record
        var staffUser = new StaffUser
        {
            UserId = user.Id,
            RestaurantId = request.RestaurantId,
            StaffRole = Enum.Parse<StaffRole>(request.StaffRole),
            IsActive = true
        };

        _db.StaffUsers.Add(staffUser);
        await _db.SaveChangesAsync(ct);

        return new StaffUserDto
        {
            Id = staffUser.Id,
            UserId = user.Id,
            FullName = user.FullName ?? string.Empty,
            MobileNumber = user.MobileNumber,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            RestaurantId = request.RestaurantId,
            RestaurantName = restaurant.Name,
            StaffRole = staffUser.StaffRole.ToString(),
            IsActive = staffUser.IsActive,
            CreatedAt = staffUser.CreatedAt
        };
    }
}