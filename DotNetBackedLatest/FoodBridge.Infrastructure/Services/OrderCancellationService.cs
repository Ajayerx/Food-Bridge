using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using FoodBridge.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FoodBridge.Infrastructure.Services;

public class OrderCancellationService : IHostedService, IDisposable
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderCancellationService> _logger;
    private Timer? _timer;
    private static readonly TimeSpan CancelAfter = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(60);

    public OrderCancellationService(
        IServiceScopeFactory scopeFactory,
        ILogger<OrderCancellationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OrderCancellationService started.");
        _timer = new Timer(async _ => await CancelStaleOrdersAsync(), null,
            TimeSpan.Zero, CheckInterval);
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OrderCancellationService stopped.");
        _timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _timer?.Dispose();
    }

    private async Task CancelStaleOrdersAsync()
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var cutoff = DateTime.UtcNow - CancelAfter;

            var staleOrders = await db.Orders
                .Where(o => o.OrderStatus == OrderStatus.Placed
                         && o.CreatedAt <= cutoff)
                .ToListAsync();

            if (staleOrders.Count == 0) return;

            _logger.LogInformation("Auto-cancelling {Count} stale order(s).", staleOrders.Count);

            foreach (var order in staleOrders)
            {
                var oldStatus = order.OrderStatus.ToString();

                order.MarkAsCancelled("Auto-cancelled — no confirmation within 5 minutes.");
                order.UpdatedAt = DateTime.UtcNow;

                db.OrderStatusHistories.Add(new OrderStatusHistory
                {
                    OrderId = order.Id,
                    FromStatus = oldStatus,
                    ToStatus = OrderStatus.Cancelled.ToString(),
                    Reason = "Auto-cancelled — no confirmation within 5 minutes.",
                    ChangedAt = DateTime.UtcNow,
                });
            }

            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while cancelling stale orders.");
        }
    }
}
