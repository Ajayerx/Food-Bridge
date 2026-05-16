// GetAddressesQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Users;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Users.Queries.GetAddresses;

public class GetAddressesQueryHandler
    : IRequestHandler<GetAddressesQuery, List<CustomerAddressDto>>
{
    private readonly IAppDbContext _db;

    public GetAddressesQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<CustomerAddressDto>> Handle(
        GetAddressesQuery request,
        CancellationToken ct)
    {
        var customer = await _db.Customers
            .AsNoTracking()
            .Include(c => c.Addresses)
            .FirstOrDefaultAsync(
                c => c.UserId == request.UserId, ct);

        if (customer is null)
            return new List<CustomerAddressDto>();

        return customer.Addresses
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .Select(a => new CustomerAddressDto
            {
                Id = a.Id,
                Label = a.Label,
                AddressLine1 = a.AddressLine1,
                AddressLine2 = a.AddressLine2,
                City = a.City,
                State = a.State,
                PinCode = a.PinCode,
                Latitude = a.Latitude,
                Longitude = a.Longitude,
                IsDefault = a.IsDefault
            })
            .ToList();
    }
}