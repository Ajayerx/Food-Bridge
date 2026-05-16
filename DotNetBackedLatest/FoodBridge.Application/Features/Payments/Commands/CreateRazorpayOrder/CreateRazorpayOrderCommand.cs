// CreateRazorpayOrderCommand.cs
using FoodBridge.Application.DTOs.Payments;
using MediatR;
namespace FoodBridge.Application.Features.Payments.Commands.CreateRazorpayOrder;

public record CreateRazorpayOrderCommand(
    Guid OrderId,
    Guid UserId)
    : IRequest<RazorpayOrderResponseDto>;