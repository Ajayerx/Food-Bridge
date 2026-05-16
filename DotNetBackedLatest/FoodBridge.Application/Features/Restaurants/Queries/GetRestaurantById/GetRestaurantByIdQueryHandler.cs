// GetRestaurantByIdQueryHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Restaurants;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Restaurants.Queries.GetRestaurantById;

public class GetRestaurantByIdQueryHandler
    : IRequestHandler<GetRestaurantByIdQuery, RestaurantDto>
{
    private readonly IAppDbContext _db;

    public GetRestaurantByIdQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<RestaurantDto> Handle(
        GetRestaurantByIdQuery request,
        CancellationToken ct)
    {
        var r = await _db.Restaurants
            .AsNoTracking()
            .FirstOrDefaultAsync(
                r => r.Id == request.RestaurantId
                  && r.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "Restaurant", request.RestaurantId);

        return new RestaurantDto
        {
            Id = r.Id,
            Name = r.Name,
            Description = r.Description,
            LogoUrl = r.LogoUrl,
            CoverImageUrl = r.CoverImageUrl,
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
}