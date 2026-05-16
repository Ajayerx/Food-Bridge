// CreateModifierGroupCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using FoodBridge.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Commands.CreateModifierGroup;

public class CreateModifierGroupCommandHandler
    : IRequestHandler<CreateModifierGroupCommand, ModifierGroupDto>
{
    private readonly IAppDbContext _db;

    public CreateModifierGroupCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<ModifierGroupDto> Handle(
        CreateModifierGroupCommand request,
        CancellationToken ct)
    {
        var menuItem = await _db.MenuItems
            .FirstOrDefaultAsync(
                i => i.Id == request.MenuItemId
                  && i.DeletedAt == null, ct)
            ?? throw new NotFoundException(
                "Menu item", request.MenuItemId);

        var group = new ModifierGroup
        {
            MenuItemId = request.MenuItemId,
            Name = request.Name,
            IsRequired = request.IsRequired,
            MaxSelections = request.MaxSelections
        };

        _db.ModifierGroups.Add(group);
        await _db.SaveChangesAsync(ct);

        return new ModifierGroupDto
        {
            Id = group.Id,
            Name = group.Name,
            IsRequired = group.IsRequired,
            MaxSelections = group.MaxSelections
        };
    }
}