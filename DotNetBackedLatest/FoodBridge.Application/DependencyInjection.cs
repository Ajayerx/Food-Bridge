using FoodBridge.Application.Common.Behaviours;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace FoodBridge.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(
        this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // ── MediatR ──────────────────────────────────────
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(assembly));

        // ── Pipeline Behaviours (ORDER matters) ──────────
        // 1. Logging  → runs first, wraps everything
        services.AddTransient(
            typeof(IPipelineBehavior<,>),
            typeof(LoggingBehaviour<,>));

        // 2. Validation → runs before handler
        services.AddTransient(
            typeof(IPipelineBehavior<,>),
            typeof(ValidationBehaviour<,>));

        // 3. Caching → runs for ICacheable queries only
        services.AddTransient(
            typeof(IPipelineBehavior<,>),
            typeof(CachingBehaviour<,>));

        // ── FluentValidation ─────────────────────────────
        // Auto-registers all validators in Application assembly
        services.AddValidatorsFromAssembly(assembly);

        return services;
    }
}