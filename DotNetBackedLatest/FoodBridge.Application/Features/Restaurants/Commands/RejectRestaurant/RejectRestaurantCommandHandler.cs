using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Restaurants.Commands.RejectRestaurant;

public class RejectRestaurantCommandHandler : IRequestHandler<RejectRestaurantCommand, Unit>
{
    private readonly IAppDbContext _db;
    public RejectRestaurantCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(RejectRestaurantCommand request, CancellationToken ct)
    {
        var restaurant = await _db.Restaurants
            .Include(r => r.Vendor)
            .FirstOrDefaultAsync(r => r.Id == request.RestaurantId, ct)
            ?? throw new NotFoundException("Restaurant not found.");

        restaurant.Status = RestaurantStatus.Rejected;
        restaurant.RejectionReason = request.Reason;
        restaurant.UpdatedAt = DateTime.UtcNow;

        // ← removed: the vendor side-effect

        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
