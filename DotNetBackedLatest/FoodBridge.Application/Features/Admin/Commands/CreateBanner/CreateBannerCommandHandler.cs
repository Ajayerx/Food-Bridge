using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Admin;
using FoodBridge.Domain.Entities;
using MediatR;
namespace FoodBridge.Application.Features.Admin.Commands.CreateBanner;

public class CreateBannerCommandHandler : IRequestHandler<CreateBannerCommand, BannerDto>
{
    private readonly IAppDbContext _db;
    public CreateBannerCommandHandler(IAppDbContext db) => _db = db;

    public async Task<BannerDto> Handle(CreateBannerCommand request, CancellationToken ct)
    {
        var banner = new Banner
        {
            Title = request.Title,
            SubTitle = request.SubTitle,
            ImageUrl = request.ImageUrl,
            LinkUrl = request.LinkUrl,
            LinkType = request.LinkType,
            IsActive = request.IsActive,
            DisplayOrder = request.DisplayOrder,
            StartsAt = request.StartsAt,
            EndsAt = request.EndsAt
        };

        _db.Banners.Add(banner);
        await _db.SaveChangesAsync(ct);

        return new BannerDto
        {
            Id = banner.Id,
            Title = banner.Title,
            SubTitle = banner.SubTitle,
            ImageUrl = banner.ImageUrl,
            LinkUrl = banner.LinkUrl,
            LinkType = banner.LinkType,
            IsActive = banner.IsActive,
            DisplayOrder = banner.DisplayOrder,
            StartsAt = banner.StartsAt,
            EndsAt = banner.EndsAt,
            CreatedAt = banner.CreatedAt
        };
    }
}
