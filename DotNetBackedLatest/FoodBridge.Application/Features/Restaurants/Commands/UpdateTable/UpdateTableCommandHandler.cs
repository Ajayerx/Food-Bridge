// UpdateTableCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Restaurants;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Restaurants.Commands.UpdateTable;

public class UpdateTableCommandHandler
    : IRequestHandler<UpdateTableCommand, RestaurantTableDto>
{
    private readonly IAppDbContext _db;

    public UpdateTableCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<RestaurantTableDto> Handle(
        UpdateTableCommand request,
        CancellationToken ct)
    {
        var table = await _db.RestaurantTables
            .FirstOrDefaultAsync(t => t.Id == request.TableId, ct)
            ?? throw new NotFoundException("RestaurantTable", request.TableId);

        // Guard: new table number must not clash with another table in the same restaurant
        var duplicate = await _db.RestaurantTables
            .AnyAsync(t => t.RestaurantId == table.RestaurantId
                        && t.TableNumber == request.TableNumber
                        && t.Id != request.TableId, ct);

        if (duplicate)
            throw new BadRequestException(
                $"Table number '{request.TableNumber}' already exists in this restaurant.");

        table.TableNumber = request.TableNumber;
        table.Capacity = request.Capacity;
        if (request.Status.HasValue)
            table.Status = request.Status.Value;

        await _db.SaveChangesAsync(ct);

        return new RestaurantTableDto
        {
            Id = table.Id,
            RestaurantId = table.RestaurantId,
            TableNumber = table.TableNumber,
            Capacity = table.Capacity,
            Status = table.Status.ToString()
        };
    }
}