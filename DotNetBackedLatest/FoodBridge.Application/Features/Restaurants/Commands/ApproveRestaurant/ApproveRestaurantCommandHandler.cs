// ApproveRestaurantCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Restaurants.Commands.ApproveRestaurant;

public class ApproveRestaurantCommandHandler
    : IRequestHandler<ApproveRestaurantCommand, Unit>
{
    private readonly IAppDbContext _db;

    public ApproveRestaurantCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        ApproveRestaurantCommand request,
        CancellationToken ct)
    {
        var restaurant = await _db.Restaurants
            .FirstOrDefaultAsync(
                r => r.Id == request.RestaurantId
                  && r.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "Restaurant", request.RestaurantId);

        restaurant.Status = RestaurantStatus.Active;
        restaurant.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}