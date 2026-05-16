using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Orders.Commands.SettleBill;

public class SettleBillCommandHandler
    : IRequestHandler<SettleBillCommand, Unit>
{
    private readonly IAppDbContext _db;

    public SettleBillCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        SettleBillCommand request,
        CancellationToken ct)
    {
        var order = await _db.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct)
            ?? throw new NotFoundException("Order", request.OrderId);

        var method = Enum.Parse<PaymentMethod>(request.PaymentMethod);
        order.SettleBill(method);

        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}