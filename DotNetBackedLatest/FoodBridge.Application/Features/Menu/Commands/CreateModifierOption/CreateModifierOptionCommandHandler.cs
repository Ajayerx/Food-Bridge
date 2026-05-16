// CreateModifierOptionCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Menu;
using FoodBridge.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Menu.Commands.CreateModifierOption;

public class CreateModifierOptionCommandHandler
    : IRequestHandler<CreateModifierOptionCommand, ModifierOptionDto>
{
    private readonly IAppDbContext _db;

    public CreateModifierOptionCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<ModifierOptionDto> Handle(
        CreateModifierOptionCommand request,
        CancellationToken ct)
    {
        var group = await _db.ModifierGroups
            .FirstOrDefaultAsync(
                g => g.Id == request.ModifierGroupId, ct)
            ?? throw new NotFoundException(
                "Modifier group", request.ModifierGroupId);

        var option = new ModifierOption
        {
            ModifierGroupId = request.ModifierGroupId,
            Name = request.Name,
            AdditionalPrice = request.AdditionalPrice,
            IsAvailable = true
        };

        _db.ModifierOptions.Add(option);
        await _db.SaveChangesAsync(ct);

        return new ModifierOptionDto
        {
            Id = option.Id,
            Name = option.Name,
            AdditionalPrice = option.AdditionalPrice,
            IsAvailable = option.IsAvailable
        };
    }
}