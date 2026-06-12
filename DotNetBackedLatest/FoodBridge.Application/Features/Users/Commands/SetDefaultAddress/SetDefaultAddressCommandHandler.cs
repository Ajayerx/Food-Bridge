// SetDefaultAddressCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Users.Commands.SetDefaultAddress;

public class SetDefaultAddressCommandHandler
    : IRequestHandler<SetDefaultAddressCommand, Unit>
{
    private readonly IAppDbContext _db;

    public SetDefaultAddressCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        SetDefaultAddressCommand request,
        CancellationToken ct)
    {
        var customer = await _db.Customers
            .Include(c => c.Addresses)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId, ct)
            ?? throw new NotFoundException("Customer profile not found.");

        var address = customer.Addresses
            .FirstOrDefault(a => a.Id == request.AddressId)
            ?? throw new NotFoundException("Address", request.AddressId);

        // Atomic transaction: reset all, then set one
        foreach (var addr in customer.Addresses)
        {
            addr.IsDefault = false;
            addr.UpdatedAt = DateTime.UtcNow;
        }

        address.IsDefault = true;
        address.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}
