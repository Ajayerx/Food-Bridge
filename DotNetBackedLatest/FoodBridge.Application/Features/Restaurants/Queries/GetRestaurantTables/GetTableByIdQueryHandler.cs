// GetTableByIdQueryHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Restaurants;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Restaurants.Queries.GetTableById;

public class GetTableByIdQueryHandler
    : IRequestHandler<GetTableByIdQuery, RestaurantTableDto>
{
    private readonly IAppDbContext _db;

    public GetTableByIdQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<RestaurantTableDto> Handle(
        GetTableByIdQuery request,
        CancellationToken ct)
    {
        var t = await _db.RestaurantTables
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == request.TableId, ct)
            ?? throw new NotFoundException("RestaurantTable", request.TableId);

        return new RestaurantTableDto
        {
            Id = t.Id,
            RestaurantId = t.RestaurantId,
            TableNumber = t.TableNumber,
            Capacity = t.Capacity,
            Status = t.Status.ToString()
        };
    }
}