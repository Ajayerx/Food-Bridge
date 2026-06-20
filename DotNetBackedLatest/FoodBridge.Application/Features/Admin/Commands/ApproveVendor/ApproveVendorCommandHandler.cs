using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Admin.Commands.ApproveVendor;

public class ApproveVendorCommandHandler : IRequestHandler<ApproveVendorCommand, Unit>
{
    private readonly IAppDbContext _db;
    public ApproveVendorCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(ApproveVendorCommand request, CancellationToken ct)
    {
        var vendor = await _db.Vendors
            .Include(v => v.User)
            .Include(v => v.Restaurants)   // ← add this
            .FirstOrDefaultAsync(v => v.Id == request.VendorId, ct)
            ?? throw new NotFoundException("Vendor not found.");

        if (vendor.Status != VendorStatus.Pending)
            throw new BadRequestException($"Vendor is already {vendor.Status.ToString().ToLowerInvariant()}.");

        // Approve the vendor
        vendor.Status = VendorStatus.Approved;
        vendor.ApprovedAt = DateTime.UtcNow;

        // Activate the user account (was incorrectly set to Active at registration)
        vendor.User.Status = UserStatus.Active;

        // Cascade: activate all restaurants created during registration
        foreach (var restaurant in vendor.Restaurants
            .Where(r => r.Status == RestaurantStatus.Pending))
        {
            restaurant.Status = RestaurantStatus.Active;
            restaurant.UpdatedAt = DateTime.UtcNow;
        }

        _db.Notifications.Add(new Notification
        {
            UserId = vendor.UserId,
            Title = "Vendor Approved",
            Body = $"Your vendor account \"{vendor.BusinessName}\" has been approved. You can now log in.",
            Type = NotificationType.System,
            ActionUrl = "/vendor/dashboard"
        });

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = request.AdminUserId,
            Action = AuditAction.Update,
            EntityName = "Vendor",
            EntityId = vendor.Id.ToString(),
            Details = $"Vendor \"{vendor.BusinessName}\" approved."
        });

        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
