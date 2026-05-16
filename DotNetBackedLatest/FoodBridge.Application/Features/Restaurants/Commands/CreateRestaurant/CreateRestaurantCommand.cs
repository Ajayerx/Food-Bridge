// CreateRestaurantCommand.cs
using FoodBridge.Application.DTOs.Restaurants;
using MediatR;
namespace FoodBridge.Application.Features.Restaurants.Commands.CreateRestaurant;

public record CreateRestaurantCommand(
    Guid VendorUserId,
    string Name,
    string? Description,
    string AddressLine,
    string City,
    string State,
    string PinCode,
    decimal Latitude,
    decimal Longitude,
    string? PhoneNumber,
    string? FssaiLicense,
    decimal DeliveryFee,
    decimal MinOrderAmount,
    int AvgDeliveryMinutes)
    : IRequest<RestaurantDto>;