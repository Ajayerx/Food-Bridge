// GetAddressesQuery.cs
using FoodBridge.Application.DTOs.Users;
using MediatR;
namespace FoodBridge.Application.Features.Users.Queries.GetAddresses;

public record GetAddressesQuery(Guid UserId)
    : IRequest<List<CustomerAddressDto>>;