using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Restaurants.Commands.SubmitForApproval;

public class SubmitForApprovalCommandHandler : IRequestHandler<SubmitForApprovalCommand, Unit>
{
    private readonly IAppDbContext _db;
    public SubmitForApprovalCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(SubmitForApprovalCommand request, CancellationToken ct)
    {
        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(v => v.UserId == request.VendorUserId, ct)
            ?? throw new NotFoundException("Vendor profile not found.");

        var restaurant = await _db.Restaurants
            .FirstOrDefaultAsync(r => r.Id == request.RestaurantId && r.VendorId == vendor.Id, ct)
            ?? throw new NotFoundException("Restaurant not found.");

        if (restaurant.Status != RestaurantStatus.Inactive &&
            restaurant.Status != RestaurantStatus.Pending)
            throw new BadRequestException("Restaurant is already submitted or approved.");

        restaurant.Status = RestaurantStatus.Pending;
        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
