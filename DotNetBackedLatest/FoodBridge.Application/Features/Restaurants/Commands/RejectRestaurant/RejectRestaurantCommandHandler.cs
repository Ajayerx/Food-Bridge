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
            .FirstOrDefaultAsync(r => r.Id == request.RestaurantId, ct)
            ?? throw new NotFoundException("Restaurant not found.");

        restaurant.Status = RestaurantStatus.Rejected;
        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
