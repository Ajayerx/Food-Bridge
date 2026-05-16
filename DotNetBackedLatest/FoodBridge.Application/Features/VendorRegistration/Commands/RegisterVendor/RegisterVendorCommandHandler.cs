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
        // Check if mobile number already exists
        var existingUser = await _db.Users
            .FirstOrDefaultAsync(u => u.MobileNumber == request.MobileNumber, ct);

        if (existingUser != null)
            throw new BadRequestException("A user with this mobile number already exists.");

        // Create User
        var user = new User
        {
            MobileNumber = request.MobileNumber,
            FullName = request.FullName,
            Email = request.Email,
            Role = UserRole.Vendor,
            Status = UserStatus.Active
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
            Status = VendorStatus.Pending
        };
        _db.Vendors.Add(vendor);

        await _db.SaveChangesAsync(ct);

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
