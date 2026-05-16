using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Restaurants.Commands.ReserveTable;

public class ReserveTableCommandHandler : IRequestHandler<ReserveTableCommand>
{
    private readonly IAppDbContext _context;

    public ReserveTableCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(ReserveTableCommand request, CancellationToken ct)
    {
        var table = await _context.RestaurantTables        
            .FirstOrDefaultAsync(t => t.Id == request.TableId, ct)
            ?? throw new KeyNotFoundException("Table not found");

        if (table.Status == TableStatus.Occupied)
            throw new InvalidOperationException("Table is currently occupied");

        if (table.Status == TableStatus.Reserved)
            throw new InvalidOperationException("Table is already reserved");

        if (table.Status == TableStatus.OutOfService)
            throw new InvalidOperationException("Table is out of service");

        if (table.Status != TableStatus.Available)
            throw new InvalidOperationException($"Table is {table.Status}, cannot reserve");

        table.Status = TableStatus.Reserved;
        table.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
    }
}