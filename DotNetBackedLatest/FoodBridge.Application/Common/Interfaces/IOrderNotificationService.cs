namespace FoodBridge.Application.Common.Interfaces;

public interface IOrderNotificationService
{
    Task NotifyOrderStatusChanged(Guid orderId, string status, CancellationToken ct = default);
}