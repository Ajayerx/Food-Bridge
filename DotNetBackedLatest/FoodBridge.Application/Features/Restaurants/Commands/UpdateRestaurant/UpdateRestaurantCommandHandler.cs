// UpdateRestaurantCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Restaurants;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Restaurants.Commands.UpdateRestaurant;

public class UpdateRestaurantCommandHandler
    : IRequestHandler<UpdateRestaurantCommand, RestaurantDto>
{
    private readonly IAppDbContext _db;

    public UpdateRestaurantCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<RestaurantDto> Handle(
        UpdateRestaurantCommand request,
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

        if (request.Name is not null) restaurant.Name = request.Name;
        if (request.Description is not null) restaurant.Description = request.Description;
        if (request.AddressLine is not null) restaurant.AddressLine = request.AddressLine;
        if (request.City is not null) restaurant.City = request.City;
        if (request.State is not null) restaurant.State = request.State;
        if (request.PinCode is not null) restaurant.PinCode = request.PinCode;
        if (request.Latitude is not null) restaurant.Latitude = request.Latitude.Value;
        if (request.Longitude is not null) restaurant.Longitude = request.Longitude.Value;
        if (request.PhoneNumber is not null) restaurant.PhoneNumber = request.PhoneNumber;
        if (request.DeliveryFee is not null) restaurant.DeliveryFee = request.DeliveryFee.Value;
        if (request.MinOrderAmount is not null) restaurant.MinOrderAmount = request.MinOrderAmount.Value;
        if (request.AvgDeliveryMinutes is not null) restaurant.AvgDeliveryMinutes = request.AvgDeliveryMinutes.Value;

        restaurant.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return new RestaurantDto
        {
            Id = restaurant.Id,
            Name = restaurant.Name,
            Description = restaurant.Description,
            AddressLine = restaurant.AddressLine,
            City = restaurant.City,
            State = restaurant.State,
            PinCode = restaurant.PinCode,
            Latitude = restaurant.Latitude,
            Longitude = restaurant.Longitude,
            PhoneNumber = restaurant.PhoneNumber,
            Status = restaurant.Status.ToString(),
            IsOpen = restaurant.IsOpen,
            DeliveryFee = restaurant.DeliveryFee,
            MinOrderAmount = restaurant.MinOrderAmount,
            AvgDeliveryMinutes = restaurant.AvgDeliveryMinutes,
            AvgRating = restaurant.AvgRating,
            TotalRatings = restaurant.TotalRatings,
            CreatedAt = restaurant.CreatedAt
        };
    }
}