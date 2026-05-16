// DeleteTableCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Restaurants.Commands.DeleteTable;

public class DeleteTableCommandHandler : IRequestHandler<DeleteTableCommand>
{
    private readonly IAppDbContext _db;

    public DeleteTableCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task Handle(DeleteTableCommand request, CancellationToken ct)
    {
        var table = await _db.RestaurantTables
            .FirstOrDefaultAsync(t => t.Id == request.TableId, ct)
            ?? throw new NotFoundException("RestaurantTable", request.TableId);

        _db.RestaurantTables.Remove(table);
        await _db.SaveChangesAsync(ct);
    }
}