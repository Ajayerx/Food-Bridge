// DeleteStaffCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Staff.Commands.DeleteStaff;

public class DeleteStaffCommandHandler
    : IRequestHandler<DeleteStaffCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteStaffCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        DeleteStaffCommand request,
        CancellationToken ct)
    {
        // 1. Verify vendor owns restaurant
        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(
                v => v.UserId == request.VendorUserId, ct)
            ?? throw new NotFoundException(
                "Vendor profile not found.");

        var restaurantExists = await _db.Restaurants
            .AnyAsync(
                r => r.Id == request.RestaurantId
                  && r.VendorId == vendor.Id, ct);

        if (!restaurantExists)
            throw new ForbiddenException(
                "You do not own this restaurant.");

        // 2. Get staff
        var staff = await _db.StaffUsers
            .FirstOrDefaultAsync(
                s => s.Id == request.StaffId
                  && s.RestaurantId == request.RestaurantId
                  && s.IsActive == true, ct)
            ?? throw new NotFoundException(
                "Staff member", request.StaffId);

        // 3. Soft delete
        staff.IsActive = false;
        staff.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}