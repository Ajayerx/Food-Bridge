// ToggleRestaurantStatusCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Restaurants.Commands.ToggleRestaurantStatus;

public class ToggleRestaurantStatusCommandHandler
    : IRequestHandler<ToggleRestaurantStatusCommand, bool>
{
    private readonly IAppDbContext _db;

    public ToggleRestaurantStatusCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<bool> Handle(
        ToggleRestaurantStatusCommand request,
        CancellationToken ct)
    {
        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(
                v => v.UserId == request.VendorUserId, ct)
            ?? throw new NotFoundException("Vendor profile not found.");

        var restaurant = await _db.Restaurants
            .FirstOrDefaultAsync(
                r => r.Id == request.RestaurantId
                  && r.VendorId == vendor.Id
                  && r.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "Restaurant", request.RestaurantId);

        restaurant.IsOpen = !restaurant.IsOpen;
        restaurant.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return restaurant.IsOpen;
    }
}