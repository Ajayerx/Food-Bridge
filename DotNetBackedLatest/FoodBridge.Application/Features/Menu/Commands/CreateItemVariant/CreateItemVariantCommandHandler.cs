// CreateItemVariantCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using FoodBridge.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Commands.CreateItemVariant;

public class CreateItemVariantCommandHandler
    : IRequestHandler<CreateItemVariantCommand, ItemVariantDto>
{
    private readonly IAppDbContext _db;

    public CreateItemVariantCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<ItemVariantDto> Handle(
        CreateItemVariantCommand request,
        CancellationToken ct)
    {
        var menuItem = await _db.MenuItems
            .FirstOrDefaultAsync(
                i => i.Id == request.MenuItemId
                  && i.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "Menu item", request.MenuItemId);

        var variant = new ItemVariant
        {
            MenuItemId = request.MenuItemId,
            Name = request.Name,
            Price = request.Price,
            IsAvailable = true
        };

        _db.ItemVariants.Add(variant);
        await _db.SaveChangesAsync(ct);

        return new ItemVariantDto
        {
            Id = variant.Id,
            Name = variant.Name,
            Price = variant.Price,
            IsAvailable = variant.IsAvailable
        };
    }
}