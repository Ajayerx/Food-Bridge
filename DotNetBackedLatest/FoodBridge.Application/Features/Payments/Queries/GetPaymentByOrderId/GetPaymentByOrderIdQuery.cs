// GetPaymentByOrderIdQuery.cs
using FoodBridge.Application.DTOs.Payments;
using MediatR;
namespace FoodBridge.Application.Features.Payments.Queries.GetPaymentByOrderId;

public record GetPaymentByOrderIdQuery(
    Guid OrderId,
    Guid UserId,
    string? RoleType)
    : IRequest<PaymentDto>;