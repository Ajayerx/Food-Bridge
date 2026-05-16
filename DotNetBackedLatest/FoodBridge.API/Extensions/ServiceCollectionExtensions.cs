using AspNetCoreRateLimit;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Infrastructure.Persistence;
using FoodBridge.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;

namespace FoodBridge.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── Controllers ──────────────────────────────────
        services.AddControllers()
            .AddJsonOptions(opt =>
            {
                opt.JsonSerializerOptions.PropertyNamingPolicy =
                    System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
                opt.JsonSerializerOptions.DefaultIgnoreCondition =
                    System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
            });

        // ── Swagger ──────────────────────────────────────
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(opt =>
        {
            opt.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "FoodBridge API",
                Version = "v1",
                Description = "Food Delivery Platform API — Clean Architecture + CQRS"
            });

            opt.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter your JWT token: Bearer {token}"
            });

            opt.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id   = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        // ── JWT Authentication ────────────────────────────
        var jwtSecret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret not configured");

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(opt =>
            {
                opt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                                                  Encoding.UTF8.GetBytes(jwtSecret)),
                    ClockSkew = TimeSpan.Zero
                };
            });

        services.AddAuthorization();
        // ── SignalR ───────────────────────────────────────────
        services.AddSignalR();

        // ── CORS ─────────────────────────────────────────
        //services.AddCors(opt =>
        //    opt.AddPolicy("AllowAll", policy =>
        //        policy
        //            .WithOrigins("https://localhost:5173")
        //            .AllowAnyMethod()
        //            .AllowAnyHeader()));
        services.AddCors(opt =>
            opt.AddPolicy("AllowAll", policy =>
                policy
                    .AllowAnyOrigin()   
                    .AllowAnyMethod()
                    .AllowAnyHeader()));

        // ── Response Compression ─────────────────────────
        services.AddResponseCompression(opt =>
        {
            opt.EnableForHttps = true;
            opt.Providers.Add<
                Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
        });

        // ── Rate Limiting ─────────────────────────────────
        services.AddMemoryCache();
        services.Configure<IpRateLimitOptions>(
            configuration.GetSection("IpRateLimiting"));
        services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
        services.AddSingleton<IRateLimitCounterStore,
            MemoryCacheRateLimitCounterStore>();
        services.AddSingleton<IRateLimitConfiguration,
            RateLimitConfiguration>();
        services.AddSingleton<IProcessingStrategy,
            AsyncKeyLockProcessingStrategy>();
        services.AddInMemoryRateLimiting();

        // ── HttpContext Accessor ──────────────────────────
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        return services;
    }
}