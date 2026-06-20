using System.Text.Json;
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.VendorRegistration;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.VendorRegistration.Commands.RegisterVendor;

public class RegisterVendorCommandHandler : IRequestHandler<RegisterVendorCommand, VendorRegisterResponseDto>
{
    private readonly IAppDbContext _db;
    public RegisterVendorCommandHandler(IAppDbContext db) => _db = db;

    public async Task<VendorRegisterResponseDto> Handle(RegisterVendorCommand request, CancellationToken ct)
    {
        // ── Uniqueness checks (approximate — final enforcement via DB unique indexes) ──
        var existingMobile = await _db.Users
            .AnyAsync(u => u.MobileNumber == request.MobileNumber, ct);

        if (existingMobile)
            throw new BadRequestException("A user with this mobile number already exists.");

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var existingEmail = await _db.Users
                .AnyAsync(u => u.Email == request.Email, ct);

            if (existingEmail)
                throw new BadRequestException("A user with this email already exists.");
        }

        // ── Single atomic save ──────────────────────────────────────────────────────
        // Create User
        var user = new User
        {
            MobileNumber = request.MobileNumber,
            FullName = request.FullName,
            Email = request.Email,
            Role = UserRole.Vendor,
            Status = UserStatus.Inactive

        };
        _db.Users.Add(user);

        // Create Vendor profile
        var vendor = new Vendor
        {
            UserId = user.Id,
            BusinessName = request.BusinessName,
            GstNumber = request.GstNumber,
            PanNumber = request.PanNumber,
            BankAccountNumber = request.BankAccountNumber,
            BankIfscCode = request.BankIfscCode,
            BankHolderName = request.BankHolderName,
            Status = VendorStatus.Pending
        };
        _db.Vendors.Add(vendor);

        // Create Restaurant entity
        var cuisinesStr = request.Cuisines is { Count: > 0 }
            ? JsonSerializer.Serialize(request.Cuisines)
            : null;

        var operatingHoursStr = request.OperatingHours is not null
            ? request.OperatingHours.Value.GetRawText()
            : null;

        var restaurant = new Restaurant
        {
            VendorId = vendor.Id,
            Name = request.RestaurantName,
            Description = request.Description,
            Cuisines = cuisinesStr,
            OperatingHours = operatingHoursStr,
            AddressLine = request.Address,
            City = request.City,
            State = request.State,
            PinCode = request.PinCode,
            Latitude = request.Latitude ?? 0,
            Longitude = request.Longitude ?? 0,
            IsPureVeg = request.IsPureVeg,
            FssaiLicense = request.FssaiLicense,
            PhoneNumber = request.PhoneNumber,
            DeliveryFee = request.DeliveryFee,
            MinOrderAmount = request.MinOrderAmount,
            AvgPrepMinutes = request.AvgPrepMinutes,
            IsDineInEnabled = request.IsDineInEnabled,
            IsTakeawayEnabled = request.IsTakeawayEnabled,
            IsDeliveryEnabled = request.IsDeliveryEnabled,
            Status = RestaurantStatus.Pending
        };
        _db.Restaurants.Add(restaurant);

        // Send notification to all admin users (in-memory, committed atomically below)
        var adminUsers = await _db.Users
            .Where(u => u.Role == UserRole.Admin)
            .ToListAsync(ct);

        foreach (var admin in adminUsers)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = admin.Id,
                Title = "New Vendor Registration",
                Body = $"Vendor \"{vendor.BusinessName}\" has registered and is pending approval.",
                Type = NotificationType.System,
                ActionUrl = $"/admin/vendors/{vendor.Id}"
            });
        }

        // Single atomic commit — all or nothing
        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (
            ex.InnerException?.Message.Contains("UNIQUE") == true ||
            ex.InnerException?.Message.Contains("IX_Users_MobileNumber") == true ||
            ex.InnerException?.Message.Contains("IX_Users_Email") == true)
        {
            if (ex.InnerException?.Message.Contains("MobileNumber") == true)
                throw new BadRequestException("A user with this mobile number already exists.");
            if (ex.InnerException?.Message.Contains("Email") == true)
                throw new BadRequestException("A user with this email already exists.");
            throw new BadRequestException("A user with this information already exists.");
        }

        return new VendorRegisterResponseDto
        {
            UserId = user.Id,
            VendorId = vendor.Id,
            FullName = user.FullName ?? string.Empty,
            MobileNumber = user.MobileNumber,
            BusinessName = vendor.BusinessName,
            Status = vendor.Status.ToString(),
            CreatedAt = vendor.CreatedAt
        };
    }
}
