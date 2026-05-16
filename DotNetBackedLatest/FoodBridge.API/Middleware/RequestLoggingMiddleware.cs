using System.Diagnostics;

namespace FoodBridge.API.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(
        RequestDelegate next,
        ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        var requestId = Guid.NewGuid().ToString("N")[..8].ToUpper();

        // ── Log incoming request ──────────────────────────
        _logger.LogInformation(
            "[{RequestId}] --> {Method} {Path}{Query}",
            requestId,
            context.Request.Method,
            context.Request.Path,
            context.Request.QueryString);

        try
        {
            await _next(context);
        }
        finally
        {
            sw.Stop();

            var statusCode = context.Response.StatusCode;
            var elapsed = sw.ElapsedMilliseconds;

            // ── Color-code by status ──────────────────────
            if (statusCode >= 500)
            {
                _logger.LogError(
                    "[{RequestId}] <-- {Method} {Path} {StatusCode} ({Elapsed}ms)",
                    requestId,
                    context.Request.Method,
                    context.Request.Path,
                    statusCode,
                    elapsed);
            }
            else if (statusCode >= 400)
            {
                _logger.LogWarning(
                    "[{RequestId}] <-- {Method} {Path} {StatusCode} ({Elapsed}ms)",
                    requestId,
                    context.Request.Method,
                    context.Request.Path,
                    statusCode,
                    elapsed);
            }
            else
            {
                _logger.LogInformation(
                    "[{RequestId}] <-- {Method} {Path} {StatusCode} ({Elapsed}ms)",
                    requestId,
                    context.Request.Method,
                    context.Request.Path,
                    statusCode,
                    elapsed);
            }

            // ── Warn on slow requests (> 500ms) ──────────
            if (elapsed > 500)
            {
                _logger.LogWarning(
                    "[{RequestId}] SLOW REQUEST detected: {Method} {Path} took {Elapsed}ms",
                    requestId,
                    context.Request.Method,
                    context.Request.Path,
                    elapsed);
            }
        }
    }
}