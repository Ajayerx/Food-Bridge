using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Infrastructure.Persistence;
using FoodBridge.Infrastructure.Services;
using Microsoft.AspNetCore.SignalR;          // ✅ add
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FoodBridge.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── SQL Server ────────────────────────────────────
        var connectionString = configuration
            .GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "ConnectionString 'DefaultConnection' not found.");

        services.AddDbContext<AppDbContext>(opt =>
            opt.UseSqlServer(
                connectionString,
                b => b
                    .MigrationsAssembly(
                        typeof(AppDbContext).Assembly.FullName)
                    .EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(5),
                        errorNumbersToAdd: null)
                    .CommandTimeout(30))
            .EnableSensitiveDataLogging(false));

        // ── Register IAppDbContext ────────────────────────
        services.AddScoped<IAppDbContext>(
            p => p.GetRequiredService<AppDbContext>());

        // ── Memory Cache ──────────────────────────────────
        services.AddMemoryCache();

        // ── HTTP Client ───────────────────────────────────
        services.AddHttpClient();

        // ── SignalR User ID Provider ──────────────────────
        // ✅ Tells SignalR to use the NameIdentifier claim as UserId
        // This makes Clients.User("guid") work correctly
        services.AddSingleton<IUserIdProvider, NameIdentifierUserIdProvider>();

        // ── Services ──────────────────────────────────────
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddSingleton<ICacheService, CacheService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IStorageService, StorageService>();
        services.AddScoped<ISmsService, SmsService>();
        services.AddScoped<IOrderNotificationService, OrderNotificationService>();

        return services;
    }
}