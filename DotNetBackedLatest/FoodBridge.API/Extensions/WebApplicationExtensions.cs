using AspNetCoreRateLimit;
using FoodBridge.API.Middleware;
using FoodBridge.Infrastructure.Hubs;
using Serilog;

namespace FoodBridge.API.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication UseApiPipeline(this WebApplication app)
    {
        app.UseResponseCompression();
        app.UseIpRateLimiting();
        app.UseSerilogRequestLogging();
        app.UseMiddleware<ExceptionMiddleware>();

        app.UseSwagger();
        app.UseSwaggerUI(opt =>
        {
            opt.SwaggerEndpoint("/swagger/v1/swagger.json", "FoodBridge API v1");
            opt.RoutePrefix = string.Empty;
        });

        if (!app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
        }

        app.UseWebSockets();        // ✅ added — required for SignalR WebSocket transport

        app.UseCors("AllowAll");
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        app.MapHub<FoodBridge.Infrastructure.Hubs.OrderHub>("/hubs/orders");
        app.MapHub<NotificationHub>("/hubs/notifications");


        return app;
    }
}