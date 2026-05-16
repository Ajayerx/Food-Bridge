// CreateRestaurantCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Restaurants;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Restaurants.Commands.CreateRestaurant;

public class CreateRestaurantCommandHandler
    : IRequestHandler<CreateRestaurantCommand, RestaurantDto>
{
    private readonly IAppDbContext _db;

    public CreateRestaurantCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<RestaurantDto> Handle(
        CreateRestaurantCommand request,
        CancellationToken ct)
    {
        // 1. Get vendor profile
        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(
                v => v.UserId == request.VendorUserId, ct)
            ?? throw new NotFoundException(
                "Vendor profile not found. Please complete vendor registration.");

        if (vendor.Status != VendorStatus.Approved)
            throw new ForbiddenException(
                "Your vendor account is not approved yet.");

        // 2. Create restaurant
        var restaurant = new Restaurant
        {
            VendorId = vendor.Id,
            Name = request.Name,
            Description = request.Description,
            AddressLine = request.AddressLine,
            City = request.City,
            State = request.State,
            PinCode = request.PinCode,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            PhoneNumber = request.PhoneNumber,
            FssaiLicense = request.FssaiLicense,
            DeliveryFee = request.DeliveryFee,
            MinOrderAmount = request.MinOrderAmount,
            AvgDeliveryMinutes = request.AvgDeliveryMinutes,
            Status = RestaurantStatus.Pending,
            IsOpen = false
        };

        _db.Restaurants.Add(restaurant);
        await _db.SaveChangesAsync(ct);

        return MapToDto(restaurant);
    }

    private static RestaurantDto MapToDto(Restaurant r) => new()
    {
        Id = r.Id,
        Name = r.Name,
        Description = r.Description,
        AddressLine = r.AddressLine,
        City = r.City,
        State = r.State,
        PinCode = r.PinCode,
        Latitude = r.Latitude,
        Longitude = r.Longitude,
        PhoneNumber = r.PhoneNumber,
        Status = r.Status.ToString(),
        IsOpen = r.IsOpen,
        DeliveryFee = r.DeliveryFee,
        MinOrderAmount = r.MinOrderAmount,
        AvgDeliveryMinutes = r.AvgDeliveryMinutes,
        AvgRating = r.AvgRating,
        TotalRatings = r.TotalRatings,
        CreatedAt = r.CreatedAt
    };
}