// CreateMenuItemCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Commands.CreateMenuItem;

public class CreateMenuItemCommandHandler
    : IRequestHandler<CreateMenuItemCommand, MenuItemDto>
{
    private readonly IAppDbContext _db;

    public CreateMenuItemCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<MenuItemDto> Handle(
        CreateMenuItemCommand request,
        CancellationToken ct)
    {
        // Verify category belongs to restaurant
        var category = await _db.MenuCategories
            .FirstOrDefaultAsync(
                c => c.Id == request.CategoryId
                  && c.RestaurantId == request.RestaurantId
                  && c.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "Menu category", request.CategoryId);

        var item = new MenuItem
        {
            CategoryId = request.CategoryId,
            Name = request.Name,
            Description = request.Description,
            BasePrice = request.BasePrice,
            ImageUrl = request.ImageUrl,
            DietaryTag = Enum.Parse<DietaryTag>(request.DietaryTag),
            PrepTimeMinutes = request.PrepTimeMinutes,
            IsAvailable = true,
            IsFeatured = false
        };

        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync(ct);

        return new MenuItemDto
        {
            Id = item.Id,
            CategoryId = item.CategoryId,
            Name = item.Name,
            Description = item.Description,
            BasePrice = item.BasePrice,
            ImageUrl = item.ImageUrl,
            DietaryTag = item.DietaryTag.ToString(),
            IsAvailable = item.IsAvailable,
            IsFeatured = item.IsFeatured,
            PrepTimeMinutes = item.PrepTimeMinutes
        };
    }
}