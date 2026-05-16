using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Restaurants.Commands.SuspendRestaurant;

public class SuspendRestaurantCommandHandler : IRequestHandler<SuspendRestaurantCommand, Unit>
{
    private readonly IAppDbContext _db;
    public SuspendRestaurantCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(SuspendRestaurantCommand request, CancellationToken ct)
    {
        var restaurant = await _db.Restaurants
            .FirstOrDefaultAsync(r => r.Id == request.RestaurantId, ct)
            ?? throw new NotFoundException("Restaurant not found.");

        restaurant.Status = RestaurantStatus.Suspended;
        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
