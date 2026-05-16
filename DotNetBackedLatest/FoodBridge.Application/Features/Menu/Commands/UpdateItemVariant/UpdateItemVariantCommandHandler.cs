// UpdateItemVariantCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Commands.UpdateItemVariant;

public class UpdateItemVariantCommandHandler
    : IRequestHandler<UpdateItemVariantCommand, ItemVariantDto>
{
    private readonly IAppDbContext _db;

    public UpdateItemVariantCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<ItemVariantDto> Handle(
        UpdateItemVariantCommand request,
        CancellationToken ct)
    {
        var variant = await _db.ItemVariants
            .FirstOrDefaultAsync(
                v => v.Id == request.VariantId
                  && v.MenuItemId == request.MenuItemId, ct)
            ?? throw new NotFoundException(
                "Item variant", request.VariantId);

        variant.Name = request.Name;
        variant.Price = request.Price;
        variant.UpdatedAt = DateTime.UtcNow;

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