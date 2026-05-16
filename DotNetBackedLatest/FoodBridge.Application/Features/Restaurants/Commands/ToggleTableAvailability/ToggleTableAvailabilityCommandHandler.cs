// ToggleTableAvailabilityCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Restaurants.Commands.ToggleTableAvailability;

public class ToggleTableAvailabilityCommandHandler
    : IRequestHandler<ToggleTableAvailabilityCommand>
{
    private readonly IAppDbContext _db;

    public ToggleTableAvailabilityCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task Handle(ToggleTableAvailabilityCommand request, CancellationToken ct)
    {
        var table = await _db.RestaurantTables
            .FirstOrDefaultAsync(t => t.Id == request.TableId, ct)
            ?? throw new NotFoundException("RestaurantTable", request.TableId);

        table.Status = table.Status == TableStatus.Available
    ? TableStatus.OutOfService
    : TableStatus.Available;
        await _db.SaveChangesAsync(ct);
    }
}