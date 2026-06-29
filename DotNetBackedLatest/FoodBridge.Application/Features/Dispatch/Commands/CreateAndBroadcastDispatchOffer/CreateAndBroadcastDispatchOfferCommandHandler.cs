using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Dispatch;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FoodBridge.Application.Features.Dispatch.Commands.CreateAndBroadcastDispatchOffer;

public class CreateAndBroadcastDispatchOfferCommandHandler
    : IRequestHandler<CreateAndBroadcastDispatchOfferCommand, Unit>
{
    private static readonly TimeSpan OfferDuration = TimeSpan.FromSeconds(60);

    private readonly IAppDbContext _db;
    private readonly IOrderNotificationService _notifications;

    public CreateAndBroadcastDispatchOfferCommandHandler(
        IAppDbContext db,
        IOrderNotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<Unit> Handle(
        CreateAndBroadcastDispatchOfferCommand request,
        CancellationToken ct)
    {
        var order = await _db.Orders
            .Include(o => o.Restaurant)
            .Include(o => o.DeliveryAddress)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct);

        if (order == null) return Unit.Value;
        if (order.OrderType != OrderType.Delivery) return Unit.Value;
        if (order.DeliveryAgentId != null) return Unit.Value;

        // Deactivate any prior pending offers for this order
        var priorOffers = await _db.DispatchOffers
            .Where(o => o.OrderId == request.OrderId && o.Status == DispatchOfferStatus.Pending)
            .ToListAsync(ct);

        foreach (var prior in priorOffers)
        {
            prior.Status = DispatchOfferStatus.Expired;
            prior.CompletedAt = DateTime.UtcNow;
        }

        // Create a new dispatch offer
        var offer = new DispatchOffer
        {
            OrderId = order.Id,
            Status = DispatchOfferStatus.Pending,
            ExpiresAt = DateTime.UtcNow.Add(OfferDuration),
        };

        _db.DispatchOffers.Add(offer);
        await _db.SaveChangesAsync(ct);

        // Build DTO for broadcast
        var dto = new DispatchOfferDto
        {
            Id = offer.Id,
            OrderId = order.Id,
            OrderCode = order.OrderCode ?? order.Id.ToString("N")[..8].ToUpper(),
            Status = "pending",
            ExpiresAt = offer.ExpiresAt,
            CreatedAt = offer.CreatedAt,
            RestaurantName = order.Restaurant?.Name ?? "",
            RestaurantAddress = order.Restaurant != null
                ? $"{order.Restaurant.AddressLine}, {order.Restaurant.City}, {order.Restaurant.State}"
                : "",
            RestaurantLat = order.Restaurant?.Latitude ?? 0,
            RestaurantLng = order.Restaurant?.Longitude ?? 0,
            DeliveryAddress = order.DeliveryAddress != null
                ? $"{order.DeliveryAddress.AddressLine1}, {order.DeliveryAddress.City}, {order.DeliveryAddress.State}"
                : "",
            DeliveryLat = order.DeliveryAddress?.Latitude ?? 0,
            DeliveryLng = order.DeliveryAddress?.Longitude ?? 0,
            EstimatedEarnings = CalculateEarnings(order.TotalAmount),
            EstimatedDistanceKm = CalculateDistance(
                order.Restaurant?.Latitude ?? 0, order.Restaurant?.Longitude ?? 0,
                order.DeliveryAddress?.Latitude ?? 0, order.DeliveryAddress?.Longitude ?? 0),
        };

        // Broadcast to all available delivery agents
        await _notifications.NotifyNewDispatchOffer(dto, ct);

        return Unit.Value;
    }

    private static decimal CalculateEarnings(decimal orderTotal)
    {
        // Simple model: base delivery fee + 10% of order total
        return Math.Round(20 + orderTotal * 0.1m, 2);
    }

    private static decimal CalculateDistance(decimal lat1, decimal lng1, decimal lat2, decimal lng2)
    {
        // Haversine approximation
        const double R = 6371;
        var dLat = (double)(lat2 - lat1) * Math.PI / 180;
        var dLon = (double)(lng2 - lng1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos((double)lat1 * Math.PI / 180) * Math.Cos((double)lat2 * Math.PI / 180) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return Math.Round((decimal)(R * c), 1);
    }
}