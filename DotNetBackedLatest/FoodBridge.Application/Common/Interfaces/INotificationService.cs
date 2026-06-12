// In FoodBridge.Application/Common/Interfaces/INotificationService.cs
// REPLACE the entire interface:

using FoodBridge.Domain.Enums;

namespace FoodBridge.Application.Common.Interfaces;

public interface INotificationService
{
    Task<Guid> SendToUserAsync(
        Guid userId,
        string title,
        string body,
        object? data = null,
        NotificationType type = NotificationType.System,  // ✅ add this
        CancellationToken ct = default);

    Task SendToManyAsync(
        IEnumerable<Guid> userIds,
        string title,
        string body,
        object? data = null,
        CancellationToken ct = default);

    Task SendToTopicAsync(
        string topic,
        string title,
        string body,
        object? data = null,
        CancellationToken ct = default);
}