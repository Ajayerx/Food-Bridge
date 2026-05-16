// UpdateMenuItemCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Commands.UpdateMenuItem;

public class UpdateMenuItemCommandHandler
    : IRequestHandler<UpdateMenuItemCommand, MenuItemDto>
{
    private readonly IAppDbContext _db;

    public UpdateMenuItemCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<MenuItemDto> Handle(
        UpdateMenuItemCommand request,
        CancellationToken ct)
    {
        var item = await _db.MenuItems
            .Include(i => i.Category)
            .FirstOrDefaultAsync(
                i => i.Id == request.MenuItemId
                  && i.Category.RestaurantId == request.RestaurantId
                  && i.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "Menu item", request.MenuItemId);

        if (request.Name is not null) item.Name = request.Name;
        if (request.Description is not null) item.Description = request.Description;
        if (request.BasePrice is not null) item.BasePrice = request.BasePrice.Value;
        if (request.ImageUrl is not null) item.ImageUrl = request.ImageUrl;
        if (request.IsAvailable is not null) item.IsAvailable = request.IsAvailable.Value;
        if (request.IsFeatured is not null) item.IsFeatured = request.IsFeatured.Value;
        if (request.PrepTimeMinutes is not null) item.PrepTimeMinutes = request.PrepTimeMinutes.Value;
        if (request.DietaryTag is not null)
            item.DietaryTag = Enum.Parse<DietaryTag>(request.DietaryTag);

        item.UpdatedAt = DateTime.UtcNow;

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