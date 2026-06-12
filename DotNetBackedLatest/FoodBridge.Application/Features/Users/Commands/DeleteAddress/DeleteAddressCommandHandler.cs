// DeleteAddressCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Users.Commands.DeleteAddress;

public class DeleteAddressCommandHandler
    : IRequestHandler<DeleteAddressCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteAddressCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        DeleteAddressCommand request,
        CancellationToken ct)
    {
        var customer = await _db.Customers
            .Include(c => c.Addresses)
            .FirstOrDefaultAsync(
                c => c.UserId == request.UserId, ct)
            ?? throw new NotFoundException(
                "Customer profile not found.");

        var address = customer.Addresses
            .FirstOrDefault(a => a.Id == request.AddressId)
            ?? throw new NotFoundException(
                "Address", request.AddressId);

        // Soft delete — keeps the row so FK on Orders stays intact
        address.DeletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}