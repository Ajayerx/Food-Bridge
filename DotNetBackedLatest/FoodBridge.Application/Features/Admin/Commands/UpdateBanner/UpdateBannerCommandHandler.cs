using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Admin;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Admin.Commands.UpdateBanner;

public class UpdateBannerCommandHandler : IRequestHandler<UpdateBannerCommand, BannerDto>
{
    private readonly IAppDbContext _db;
    public UpdateBannerCommandHandler(IAppDbContext db) => _db = db;

    public async Task<BannerDto> Handle(UpdateBannerCommand request, CancellationToken ct)
    {
        var banner = await _db.Banners
            .FirstOrDefaultAsync(b => b.Id == request.BannerId, ct)
            ?? throw new NotFoundException($"Banner {request.BannerId} not found.");

        if (request.Title is not null) banner.Title = request.Title;
        if (request.SubTitle is not null) banner.SubTitle = request.SubTitle;
        if (request.ImageUrl is not null) banner.ImageUrl = request.ImageUrl;
        if (request.LinkUrl is not null) banner.LinkUrl = request.LinkUrl;
        if (request.LinkType is not null) banner.LinkType = request.LinkType;
        if (request.IsActive.HasValue) banner.IsActive = request.IsActive.Value;
        if (request.DisplayOrder.HasValue) banner.DisplayOrder = request.DisplayOrder.Value;
        if (request.StartsAt.HasValue) banner.StartsAt = request.StartsAt;
        if (request.EndsAt.HasValue) banner.EndsAt = request.EndsAt;

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
