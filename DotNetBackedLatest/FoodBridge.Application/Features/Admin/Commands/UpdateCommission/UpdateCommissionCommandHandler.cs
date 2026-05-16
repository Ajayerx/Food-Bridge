using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Admin;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Admin.Commands.UpdateCommission;

public class UpdateCommissionCommandHandler : IRequestHandler<UpdateCommissionCommand, CommissionDto>
{
    private readonly IAppDbContext _db;
    public UpdateCommissionCommandHandler(IAppDbContext db) => _db = db;

    public async Task<CommissionDto> Handle(UpdateCommissionCommand request, CancellationToken ct)
    {
        var commission = await _db.Commissions
            .Include(c => c.Restaurant)
            .FirstOrDefaultAsync(c => c.Id == request.CommissionId, ct)
            ?? throw new NotFoundException($"Commission {request.CommissionId} not found.");

        commission.Rate = request.Rate;
        commission.Type = Enum.Parse<CommissionType>(request.Type, ignoreCase: true);
        if (request.Notes is not null) commission.Notes = request.Notes;

        await _db.SaveChangesAsync(ct);

        return new CommissionDto
        {
            Id = commission.Id,
            OrderId = commission.OrderId,
            RestaurantId = commission.RestaurantId,
            RestaurantName = commission.Restaurant.Name,
            Amount = commission.Amount,
            Rate = commission.Rate,
            Type = commission.Type.ToString(),
            Notes = commission.Notes,
            VendorPayoutId = commission.VendorPayoutId,
            CreatedAt = commission.CreatedAt
        };
    }
}
