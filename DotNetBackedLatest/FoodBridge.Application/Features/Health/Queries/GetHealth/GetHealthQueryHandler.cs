using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Health;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Health.Queries.GetHealth;

public class GetHealthQueryHandler : IRequestHandler<GetHealthQuery, HealthDto>
{
    private readonly IAppDbContext _db;
    public GetHealthQueryHandler(IAppDbContext db) => _db = db;

    public async Task<HealthDto> Handle(GetHealthQuery request, CancellationToken ct)
    {
        var checks = new Dictionary<string, string>();

        try
        {
            await _db.Users.AsNoTracking().Take(1).ToListAsync(ct);
            checks["database"] = "ok";
        }
        catch
        {
            checks["database"] = "error";
        }

        var allOk = checks.Values.All(v => v == "ok");
        return new HealthDto
        {
            Status = allOk ? "ok" : "degraded",
            Version = "1.0.0",
            Timestamp = DateTime.UtcNow,
            Checks = checks
        };
    }
}
