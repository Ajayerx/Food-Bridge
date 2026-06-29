using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FoodBridge.Infrastructure.Services;

public class DispatchOfferExpirationService : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(15);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DispatchOfferExpirationService> _logger;

    public DispatchOfferExpirationService(
        IServiceScopeFactory scopeFactory,
        ILogger<DispatchOfferExpirationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DispatchOfferExpirationService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ExpireOffersAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Error expiring dispatch offers.");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }

    private async Task ExpireOffersAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var notifications = scope.ServiceProvider.GetRequiredService<IOrderNotificationService>();

        var now = DateTime.UtcNow;

        var expiredOffers = await db.DispatchOffers
            .Where(o => o.Status == DispatchOfferStatus.Pending && o.ExpiresAt <= now)
            .ToListAsync(ct);

        if (expiredOffers.Count == 0) return;

        foreach (var offer in expiredOffers)
        {
            offer.Status = DispatchOfferStatus.Expired;
            offer.CompletedAt = now;

            _logger.LogInformation(
                "Dispatch offer {OfferId} for order {OrderId} expired.",
                offer.Id, offer.OrderId);

            await notifications.NotifyDispatchOfferExpired(offer.Id, offer.OrderId, ct);
        }

        await db.SaveChangesAsync(ct);
    }
}