using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Admin;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Admin.Queries.GetBanners;

public class GetBannersQueryHandler : IRequestHandler<GetBannersQuery, List<BannerDto>>
{
    private readonly IAppDbContext _db;
    public GetBannersQueryHandler(IAppDbContext db) => _db = db;

    public async Task<List<BannerDto>> Handle(GetBannersQuery request, CancellationToken ct)
    {
        var query = _db.Banners.AsNoTracking();
        if (request.ActiveOnly)
        {
            var now = DateTime.UtcNow;
            query = query.Where(b => b.IsActive
                && (b.StartsAt == null || b.StartsAt <= now)
                && (b.EndsAt == null || b.EndsAt >= now));
        }

        return await query
            .OrderBy(b => b.DisplayOrder)
            .Select(b => new BannerDto
            {
                Id = b.Id,
                Title = b.Title,
                SubTitle = b.SubTitle,
                ImageUrl = b.ImageUrl,
                LinkUrl = b.LinkUrl,
                LinkType = b.LinkType,
                IsActive = b.IsActive,
                DisplayOrder = b.DisplayOrder,
                StartsAt = b.StartsAt,
                EndsAt = b.EndsAt,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync(ct);
    }
}
