// GetPaymentByOrderIdQueryHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Payments;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Payments.Queries.GetPaymentByOrderId;

public class GetPaymentByOrderIdQueryHandler
    : IRequestHandler<GetPaymentByOrderIdQuery, PaymentDto>
{
    private readonly IAppDbContext _db;

    public GetPaymentByOrderIdQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<PaymentDto> Handle(
        GetPaymentByOrderIdQuery request,
        CancellationToken ct)
    {
        var payment = await _db.Payments
            .AsNoTracking()
            .Include(p => p.Order)
                .ThenInclude(o => o.Customer)
            .FirstOrDefaultAsync(
                p => p.OrderId == request.OrderId, ct)
            ?? throw new NotFoundException(
                "Payment record not found for this order.");

        // Access check
        if (request.RoleType == "Customer"
         && payment.Order.Customer.UserId != request.UserId)
            throw new ForbiddenException(
                "You are not allowed to view this payment.");

        return new PaymentDto
        {
            Id = payment.Id,
            OrderId = payment.OrderId,
            OrderCode = payment.Order.OrderCode,
            Amount = payment.Amount,
            Currency = payment.Currency,
            Status = payment.Status.ToString(),
            Method = payment.Method.ToString(),
            GatewayOrderId = payment.GatewayOrderId,
            GatewayPaymentId = payment.GatewayPaymentId,
            FailureReason = payment.FailureReason,
            CreatedAt = payment.CreatedAt,
            CapturedAt = payment.CapturedAt
        };
    }
}