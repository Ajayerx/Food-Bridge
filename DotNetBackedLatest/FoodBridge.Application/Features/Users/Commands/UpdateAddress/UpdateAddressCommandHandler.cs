// UpdateAddressCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Users;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Users.Commands.UpdateAddress;

public class UpdateAddressCommandHandler
    : IRequestHandler<UpdateAddressCommand, CustomerAddressDto>
{
    private readonly IAppDbContext _db;

    public UpdateAddressCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<CustomerAddressDto> Handle(
        UpdateAddressCommand request,
        CancellationToken ct)
    {
        // 1. Get customer
        var customer = await _db.Customers
            .Include(c => c.Addresses)
            .FirstOrDefaultAsync(
                c => c.UserId == request.UserId, ct)
            ?? throw new NotFoundException(
                "Customer profile not found.");

        // 2. Find address
        var address = customer.Addresses
            .FirstOrDefault(a => a.Id == request.AddressId)
            ?? throw new NotFoundException(
                "Address", request.AddressId);

        // 3. If IsDefault, unset others
        if (request.IsDefault)
        {
            foreach (var addr in customer.Addresses
                .Where(a => a.Id != request.AddressId))
                addr.IsDefault = false;
        }

        // 4. Update
        address.Label = request.Label;
        address.AddressLine1 = request.AddressLine1;
        address.AddressLine2 = request.AddressLine2;
        address.City = request.City;
        address.State = request.State;
        address.PinCode = request.PinCode;
        address.Latitude = request.Latitude;
        address.Longitude = request.Longitude;
        address.IsDefault = request.IsDefault;
        address.UpdatedAt = DateTime.UtcNow;

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