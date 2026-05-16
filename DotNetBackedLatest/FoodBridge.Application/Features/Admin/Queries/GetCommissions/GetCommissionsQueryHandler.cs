using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Admin;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Admin.Queries.GetCommissions;

public class GetCommissionsQueryHandler : IRequestHandler<GetCommissionsQuery, GetCommissionsResult>
{
    private readonly IAppDbContext _db;
    public GetCommissionsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<GetCommissionsResult> Handle(GetCommissionsQuery request, CancellationToken ct)
    {
        var query = _db.Commissions
            .AsNoTracking()
            .Include(c => c.Restaurant)
            .AsQueryable();

        if (request.RestaurantId.HasValue)
            query = query.Where(c => c.RestaurantId == request.RestaurantId.Value);
        if (request.From.HasValue)
            query = query.Where(c => c.CreatedAt >= request.From.Value);
        if (request.To.HasValue)
            query = query.Where(c => c.CreatedAt <= request.To.Value);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CommissionDto
            {
                Id = c.Id,
                OrderId = c.OrderId,
                RestaurantId = c.RestaurantId,
                RestaurantName = c.Restaurant.Name,
                Amount = c.Amount,
                Rate = c.Rate,
                Type = c.Type.ToString(),
                Notes = c.Notes,
                VendorPayoutId = c.VendorPayoutId,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync(ct);

        return new GetCommissionsResult(items, total);
    }
}
