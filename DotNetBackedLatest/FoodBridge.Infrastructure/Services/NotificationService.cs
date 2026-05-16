using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using FoodBridge.Infrastructure.Persistence;
using Google.Apis.Auth.OAuth2;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using JsonSerializer = System.Text.Json.JsonSerializer;
using System.Text.Json;

namespace FoodBridge.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public NotificationService(
        AppDbContext db,
        IConfiguration config)
    {
        _db = db;
        _config = config;

        // Initialize Firebase once
        
    }

    public async Task SendToUserAsync(
     Guid userId,
     string title,
     string body,
     object? data = null,
     NotificationType type = NotificationType.System,
     CancellationToken ct = default)
    {
        // ✅ Serialize data to JSON string for DB storage
        string? dataJson = null;
        if (data is not null)
        {
            // Use Newtonsoft.Json — handles anonymous types correctly unlike System.Text.Json
            dataJson = JsonConvert.SerializeObject(data);
            Console.WriteLine($"[Notification] data saved: {dataJson}");
        }

        _db.Notifications.Add(new Domain.Entities.Notification
        {
            UserId = userId,
            Title = title,
            Body = body,
            Type = type,
            IsRead = false,
            Data = dataJson,  // ✅ this was missing — was always null
        });
        await _db.SaveChangesAsync(ct);
    }

    public async Task SendToManyAsync(
        IEnumerable<Guid> userIds,
        string title,
        string body,
        object? data = null,
        CancellationToken ct = default)
    {
        var idList = userIds.ToList();

        var tokens = await _db.DeviceTokens
            .AsNoTracking()
            .Where(d => idList.Contains(d.UserId))
            .Select(d => d.Token)
            .ToListAsync(ct);

        if (!tokens.Any()) return;

        // Save notifications
        var notifications = idList
            .Select(uid => new Domain.Entities.Notification
            {
                UserId = uid,
                Title = title,
                Body = body,
                Type = Domain.Enums.NotificationType.System,
                IsRead = false
            }).ToList();

        _db.Notifications.AddRange(notifications);
        await _db.SaveChangesAsync(ct);

        await SendFcmAsync(tokens, title, body, data, ct);
    }

    public async Task SendToTopicAsync(
        string topic,
        string title,
        string body,
        object? data = null,
        CancellationToken ct = default)
    {
        var message = new Message
        {
            Topic = topic,
            Notification = new Notification
            {
                Title = title,
                Body = body
            },
            Data = data is not null
                ? JsonSerializer
                    .Deserialize<Dictionary<string, string>>(
                        JsonSerializer.Serialize(data))
                : null
        };

        await FirebaseMessaging.DefaultInstance
            .SendAsync(message, ct);
    }

    private static async Task SendFcmAsync(
        List<string> tokens,
        string title,
        string body,
        object? data,
        CancellationToken ct)
    {
        var dataDict = data is not null
            ? JsonSerializer
                .Deserialize<Dictionary<string, string>>(
                    JsonSerializer.Serialize(data))
            : null;

        // Send in batches of 500 (FCM limit)
        var batches = tokens
            .Select((t, i) => new { t, i })
            .GroupBy(x => x.i / 500)
            .Select(g => g.Select(x => x.t).ToList());

        foreach (var batch in batches)
        {
            var multicast = new MulticastMessage
            {
                Tokens = batch,
                Notification = new Notification
                {
                    Title = title,
                    Body = body
                },
                Data = dataDict,
                Android = new AndroidConfig
                {
                    Priority = Priority.High
                },
                Apns = new ApnsConfig
                {
                    Aps = new Aps
                    {
                        Sound = "default"
                    }
                }
            };

            await FirebaseMessaging.DefaultInstance
                .SendEachForMulticastAsync(multicast, ct);
        }
    }
}
