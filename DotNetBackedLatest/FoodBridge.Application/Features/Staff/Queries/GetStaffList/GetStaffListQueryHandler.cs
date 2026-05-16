// GetStaffListQueryHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Staff;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Staff.Queries.GetStaffList;

public class GetStaffListQueryHandler
    : IRequestHandler<GetStaffListQuery, List<StaffUserDto>>
{
    private readonly IAppDbContext _db;

    public GetStaffListQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<StaffUserDto>> Handle(
        GetStaffListQuery request,
        CancellationToken ct)
    {
        // 1. Verify vendor owns restaurant
        var vendor = await _db.Vendors
            .AsNoTracking()
            .FirstOrDefaultAsync(
                v => v.UserId == request.VendorUserId, ct)
            ?? throw new NotFoundException(
                "Vendor profile not found.");

        var restaurant = await _db.Restaurants
            .AsNoTracking()
            .FirstOrDefaultAsync(
                r => r.Id == request.RestaurantId
                  && r.VendorId == vendor.Id, ct)
            ?? throw new NotFoundException(
                "Restaurant", request.RestaurantId);

        // 2. Get staff list
        var staffList = await _db.StaffUsers
            .AsNoTracking()
            .Include(s => s.User)
            .Where(s => s.RestaurantId == request.RestaurantId
                     && s.IsActive == true)
            .OrderBy(s => s.StaffRole)
            .ThenBy(s => s.User.FullName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return staffList.Select(s => new StaffUserDto
        {
            Id = s.Id,
            UserId = s.UserId,
            FullName = s.User.FullName ?? string.Empty,
            MobileNumber = s.User.MobileNumber,
            Email = s.User.Email,
            AvatarUrl = s.User.AvatarUrl,
            RestaurantId = s.RestaurantId,
            RestaurantName = restaurant.Name,
            StaffRole = s.StaffRole.ToString(),
            IsActive = s.IsActive,
            CreatedAt = s.CreatedAt
        }).ToList();
    }
}