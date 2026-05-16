// CreateTableCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Restaurants;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Restaurants.Commands.CreateTable;

public class CreateTableCommandHandler
    : IRequestHandler<CreateTableCommand, RestaurantTableDto>
{
    private readonly IAppDbContext _db;

    public CreateTableCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<RestaurantTableDto> Handle(
        CreateTableCommand request,
        CancellationToken ct)
    {
        // Verify restaurant exists and belongs to requester
        var restaurant = await _db.Restaurants
            .FirstOrDefaultAsync(r => r.Id == request.RestaurantId, ct)
            ?? throw new NotFoundException("Restaurant", request.RestaurantId);

        // Guard: table number must be unique within the restaurant
        var duplicate = await _db.RestaurantTables
            .AnyAsync(t => t.RestaurantId == request.RestaurantId
                        && t.TableNumber == request.TableNumber, ct);

        if (duplicate)
            throw new BadRequestException(
                $"Table number '{request.TableNumber}' already exists in this restaurant.");

        var table = new RestaurantTable
        {
            RestaurantId = request.RestaurantId,
            TableNumber = request.TableNumber,
            Capacity = request.Capacity,
            Status = TableStatus.Available
        };

        _db.RestaurantTables.Add(table);
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