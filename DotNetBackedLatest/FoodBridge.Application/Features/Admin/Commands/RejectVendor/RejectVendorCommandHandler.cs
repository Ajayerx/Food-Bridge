using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Admin.Commands.RejectVendor;

public class RejectVendorCommandHandler : IRequestHandler<RejectVendorCommand, Unit>
{
    private readonly IAppDbContext _db;
    public RejectVendorCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(RejectVendorCommand request, CancellationToken ct)
    {
        var vendor = await _db.Vendors
            .Include(v => v.User)
            .Include(v => v.Restaurants)   // ← add this
            .FirstOrDefaultAsync(v => v.Id == request.VendorId, ct)
            ?? throw new NotFoundException("Vendor not found.");

        if (vendor.Status != VendorStatus.Pending)
            throw new BadRequestException($"Vendor is already {vendor.Status.ToString().ToLowerInvariant()}.");

        vendor.Status = VendorStatus.Rejected;

        // Cascade: reject all restaurants under this vendor
        foreach (var restaurant in vendor.Restaurants)
        {
            restaurant.Status = RestaurantStatus.Rejected;
            restaurant.RejectionReason = request.Reason;
            restaurant.UpdatedAt = DateTime.UtcNow;
        }

        var body = string.IsNullOrWhiteSpace(request.Reason)
            ? $"Your vendor account \"{vendor.BusinessName}\" has been rejected. Contact support."
            : $"Your vendor account \"{vendor.BusinessName}\" has been rejected. Reason: {request.Reason}";

        _db.Notifications.Add(new Notification
        {
            UserId = vendor.UserId,
            Title = "Vendor Registration Rejected",
            Body = body,
            Type = NotificationType.System
        });

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = request.AdminUserId,
            Action = AuditAction.Update,
            EntityName = "Vendor",
            EntityId = vendor.Id.ToString(),
            Details = $"Vendor \"{vendor.BusinessName}\" rejected. Reason: {request.Reason}"
        });

        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
