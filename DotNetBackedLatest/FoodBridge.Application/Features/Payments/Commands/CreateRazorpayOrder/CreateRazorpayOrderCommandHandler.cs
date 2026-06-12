// CreateRazorpayOrderCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Payments;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Razorpay.Api;

namespace FoodBridge.Application.Features.Payments.Commands.CreateRazorpayOrder;

public class CreateRazorpayOrderCommandHandler
    : IRequestHandler<CreateRazorpayOrderCommand, RazorpayOrderResponseDto>
{
    private readonly IAppDbContext _db;
    private readonly IConfiguration _config;

    public CreateRazorpayOrderCommandHandler(
        IAppDbContext db,
        IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<RazorpayOrderResponseDto> Handle(
        CreateRazorpayOrderCommand request,
        CancellationToken ct)
    {
        // 1. Get order
        var order = await _db.Orders
            .Include(o => o.Customer)
                .ThenInclude(c => c!.User)
            .FirstOrDefaultAsync(
                o => o.Id == request.OrderId
                  && o.Customer!.UserId == request.UserId, ct)
            ?? throw new NotFoundException("Order", request.OrderId);

        if (order.PaymentStatus == OrderPaymentStatus.Paid)
            throw new BadRequestException(
                "This order has already been paid.");

        if (order.PaymentMethod != PaymentMethod.Online)
            throw new BadRequestException(
                "This order is set to Cash on Delivery.");

        // 2. Create Razorpay order
        var keyId = _config["Razorpay:KeyId"]!;
        var keySecret = _config["Razorpay:KeySecret"]!;

        var client = new RazorpayClient(keyId, keySecret);
        var options = new Dictionary<string, object>
        {
            { "amount",   (int)(order.TotalAmount * 100) }, // paise
            { "currency", "INR" },
            { "receipt",  order.OrderCode },
            { "notes",    new Dictionary<string, string>
                {
                    { "order_id",   order.Id.ToString() },
                    { "order_code", order.OrderCode }
                }
            }
        };

        var razorpayOrder = client.Order.Create(options);
        var rzpOrderId = razorpayOrder["id"].ToString();

        // 3. Store payment record
        _db.Payments.Add(new Domain.Entities.Payment
        {
            OrderId = order.Id,
            Amount = order.TotalAmount,
            Currency = "INR",
            Status = PaymentStatus.Pending,
            Method = order.PaymentMethod,
            GatewayOrderId = rzpOrderId
        });

        await _db.SaveChangesAsync(ct);

        return new RazorpayOrderResponseDto
        {
            RazorpayOrderId = rzpOrderId!,
            KeyId = keyId,
            Amount = order.TotalAmount,
            Currency = "INR",
            OrderId = order.Id,
            OrderCode = order.OrderCode,
            CustomerName = order.Customer!.User.FullName ?? string.Empty,
            CustomerMobile = order.Customer.User.MobileNumber,
            CustomerEmail = order.Customer.User.Email
        };
    }
}