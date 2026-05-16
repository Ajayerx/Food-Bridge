// AddAddressCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Users;
using FoodBridge.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Users.Commands.AddAddress;

public class AddAddressCommandHandler
    : IRequestHandler<AddAddressCommand, CustomerAddressDto>
{
    private readonly IAppDbContext _db;

    public AddAddressCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<CustomerAddressDto> Handle(
        AddAddressCommand request,
        CancellationToken ct)
    {
        // 1. Get customer profile
        var customer = await _db.Customers
            .Include(c => c.Addresses)
            .FirstOrDefaultAsync(
                c => c.UserId == request.UserId, ct)
            ?? throw new NotFoundException(
                "Customer profile not found.");

        // 2. If IsDefault, unset all existing defaults
        if (request.IsDefault)
        {
            foreach (var addr in customer.Addresses)
                addr.IsDefault = false;
        }

        // 3. Add new address
        var address = new CustomerAddress
        {
            CustomerId = customer.Id,
            Label = request.Label,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City = request.City,
            State = request.State,
            PinCode = request.PinCode,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            IsDefault = request.IsDefault
        };

        _db.CustomerAddresses.Add(address);
        await _db.SaveChangesAsync(ct);

        return new CustomerAddressDto
        {
            Id = address.Id,
            Label = address.Label,
            AddressLine1 = address.AddressLine1,
            AddressLine2 = address.AddressLine2,
            City = address.City,
            State = address.State,
            PinCode = address.PinCode,
            Latitude = address.Latitude,
            Longitude = address.Longitude,
            IsDefault = address.IsDefault
        };
    }
}