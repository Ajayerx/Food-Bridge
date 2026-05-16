// AddAddressCommand.cs
using FoodBridge.Application.DTOs.Users;
using MediatR;
namespace FoodBridge.Application.Features.Users.Commands.AddAddress;

public record AddAddressCommand(
    Guid UserId,
    string Label,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PinCode,
    decimal Latitude,
    decimal Longitude,
    bool IsDefault)
    : IRequest<CustomerAddressDto>;