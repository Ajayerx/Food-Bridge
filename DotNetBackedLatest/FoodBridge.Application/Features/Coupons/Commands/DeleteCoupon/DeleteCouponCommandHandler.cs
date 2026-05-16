// DeleteCouponCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Coupons.Commands.DeleteCoupon;

public class DeleteCouponCommandHandler
    : IRequestHandler<DeleteCouponCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteCouponCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        DeleteCouponCommand request,
        CancellationToken ct)
    {
        var coupon = await _db.Coupons
            .FirstOrDefaultAsync(
                c => c.Id == request.CouponId, ct)
            ?? throw new NotFoundException(
                "Coupon", request.CouponId);

        // Soft delete by setting status to Inactive
        coupon.Status = CouponStatus.Inactive;
        coupon.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}