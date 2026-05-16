using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Restaurants.Commands.UnsuspendRestaurant;

public class UnsuspendRestaurantCommandHandler : IRequestHandler<UnsuspendRestaurantCommand, Unit>
{
    private readonly IAppDbContext _db;
    public UnsuspendRestaurantCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(UnsuspendRestaurantCommand request, CancellationToken ct)
    {
        var restaurant = await _db.Restaurants
            .FirstOrDefaultAsync(r => r.Id == request.RestaurantId, ct)
            ?? throw new NotFoundException("Restaurant not found.");

        if (restaurant.Status != RestaurantStatus.Suspended)
            throw new BadRequestException("Only suspended restaurants can be unsuspended.");

        restaurant.Status = RestaurantStatus.Active;
        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}