// UpdateRestaurantCommand.cs
using FoodBridge.Application.DTOs.Restaurants;
using MediatR;
namespace FoodBridge.Application.Features.Restaurants.Commands.UpdateRestaurant;

public record UpdateRestaurantCommand(
    Guid RestaurantId,
    Guid VendorUserId,
    string? Name,
    string? Description,
    string? AddressLine,
    string? City,
    string? State,
    string? PinCode,
    decimal? Latitude,
    decimal? Longitude,
    string? PhoneNumber,
    decimal? DeliveryFee,
    decimal? MinOrderAmount,
    int? AvgDeliveryMinutes)
    : IRequest<RestaurantDto>;