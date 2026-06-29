using FoodBridge.Application.DTOs.Dispatch;

namespace FoodBridge.Application.Common.Interfaces;

public interface IOrderNotificationService
{
    Task NotifyOrderStatusChanged(Guid orderId, string status, CancellationToken ct = default);
    Task NotifyNewDispatchOffer(DispatchOfferDto offer, CancellationToken ct = default);
    Task NotifyDispatchOfferAccepted(Guid offerId, Guid orderId, CancellationToken ct = default);
    Task NotifyDispatchOfferExpired(Guid offerId, Guid orderId, CancellationToken ct = default);
}