using FoodBridge.API.Extensions;
using FoodBridge.Application;
using FoodBridge.Infrastructure;
using Serilog;
using Serilog.Events;

// ── Bootstrap Logger (before host build) ─────────────────
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting FoodBridge API...");

    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ──────────────────────────────────────────
    builder.Host.UseSerilog((ctx, services, config) =>
        config
            .ReadFrom.Configuration(ctx.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .Enrich.WithMachineName()
            .Enrich.WithEnvironmentName()
            .WriteTo.Console(outputTemplate:
                "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} " +
                "{Properties:j}{NewLine}{Exception}")
            .WriteTo.File(
                path: "logs/foodbridge-.log",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30,
                outputTemplate:
                    "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] " +
                    "{Message:lj}{NewLine}{Exception}"));

    // ── Application Layer ─────────────────────────────────
    builder.Services.AddApplication();

    // ── Infrastructure Layer ──────────────────────────────
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddHttpClient(); // ← registers IHttpClientFactory

    // ── API Layer ─────────────────────────────────────────
    builder.Services.AddApiServices(builder.Configuration);

    // ── Build App ─────────────────────────────────────────
    var app = builder.Build();

    // ── Middleware Pipeline ───────────────────────────────
    app.UseApiPipeline();

    // ── Run ───────────────────────────────────────────────
    Log.Information("FoodBridge API started on {Urls}",
        string.Join(", ", app.Urls));

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "FoodBridge API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}