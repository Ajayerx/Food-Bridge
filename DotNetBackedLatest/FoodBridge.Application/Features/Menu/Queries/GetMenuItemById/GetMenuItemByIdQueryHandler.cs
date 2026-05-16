// GetMenuItemByIdQueryHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Queries.GetMenuItemById;

public class GetMenuItemByIdQueryHandler
    : IRequestHandler<GetMenuItemByIdQuery, MenuItemDto>
{
    private readonly IAppDbContext _db;

    public GetMenuItemByIdQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<MenuItemDto> Handle(
        GetMenuItemByIdQuery request,
        CancellationToken ct)
    {
        var i = await _db.MenuItems
            .AsNoTracking()
            .Include(i => i.Category)
            .Include(i => i.Variants)
            .Include(i => i.ModifierGroups)
                .ThenInclude(g => g.Options)
            .FirstOrDefaultAsync(
                i => i.Id == request.MenuItemId
                  && i.Category.RestaurantId == request.RestaurantId
                  && i.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "Menu item", request.MenuItemId);

        return new MenuItemDto
        {
            Id = i.Id,
            CategoryId = i.CategoryId,
            Name = i.Name,
            Description = i.Description,
            BasePrice = i.BasePrice,
            ImageUrl = i.ImageUrl,
            DietaryTag = i.DietaryTag.ToString(),
            IsAvailable = i.IsAvailable,
            IsFeatured = i.IsFeatured,
            PrepTimeMinutes = i.PrepTimeMinutes,
            Variants = i.Variants.Select(v => new ItemVariantDto
            {
                Id = v.Id,
                Name = v.Name,
                Price = v.Price,
                IsAvailable = v.IsAvailable
            }).ToList(),
            ModifierGroups = i.ModifierGroups.Select(g => new ModifierGroupDto
            {
                Id = g.Id,
                Name = g.Name,
                IsRequired = g.IsRequired,
                MaxSelections = g.MaxSelections,
                Options = g.Options.Select(o => new ModifierOptionDto
                {
                    Id = o.Id,
                    Name = o.Name,
                    AdditionalPrice = o.AdditionalPrice,
                    IsAvailable = o.IsAvailable
                }).ToList()
            }).ToList()
        };
    }
}