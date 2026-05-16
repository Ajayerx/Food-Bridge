// GetRestaurantTablesQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Restaurants;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace FoodBridge.Application.Features.Restaurants.Queries.GetRestaurantTables;

public class GetRestaurantTablesQueryHandler
    : IRequestHandler<GetRestaurantTablesQuery, List<RestaurantTableDto>>
{
    private readonly IAppDbContext _db;

    public GetRestaurantTablesQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<RestaurantTableDto>> Handle(
        GetRestaurantTablesQuery request,
        CancellationToken ct)
    {
        var tables = await _db.RestaurantTables
            .AsNoTracking()
            .Where(t => t.RestaurantId == request.RestaurantId)
            .OrderBy(t => t.TableNumber)
            .ToListAsync(ct);
        return tables.Select(t => new RestaurantTableDto
        {
            Id = t.Id,
            RestaurantId = t.RestaurantId,
            TableNumber = t.TableNumber,
            Capacity = t.Capacity,
            Status = t.Status.ToString(),
            
        }).ToList();
    }
}