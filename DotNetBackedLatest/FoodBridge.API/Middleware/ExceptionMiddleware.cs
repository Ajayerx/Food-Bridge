using FoodBridge.Application.Common.Exceptions;
using FluentValidation;
using System.Net;
using System.Text.Json;

namespace FoodBridge.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (FluentValidation.ValidationException ex)
        {
            _logger.LogWarning("Validation failed: {Errors}",
                string.Join(", ", ex.Errors.Select(e => e.ErrorMessage)));

            await WriteErrorAsync(
                context,
                HttpStatusCode.UnprocessableEntity,
                "VALIDATION_ERROR",
                string.Join(", ", ex.Errors.Select(e => e.ErrorMessage)),
                ex.Errors.Select(e => new
                {
                    field = e.PropertyName,
                    message = e.ErrorMessage
                }));
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning("Not found: {Message}", ex.Message);

            await WriteErrorAsync(
                context,
                HttpStatusCode.NotFound,
                "NOT_FOUND",
                ex.Message);
        }
        catch (BadRequestException ex)
        {
            _logger.LogWarning("Bad request: {Message}", ex.Message);

            await WriteErrorAsync(
                context,
                HttpStatusCode.BadRequest,
                "BAD_REQUEST",
                ex.Message);
        }
        catch (ForbiddenException ex)
        {
            _logger.LogWarning("Forbidden: {Message}", ex.Message);

            await WriteErrorAsync(
                context,
                HttpStatusCode.Forbidden,
                "FORBIDDEN",
                ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized: {Message}", ex.Message);

            await WriteErrorAsync(
                context,
                HttpStatusCode.Unauthorized,
                "UNAUTHORIZED",
                ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation: {Message}", ex.Message);

            await WriteErrorAsync(
                context,
                HttpStatusCode.Conflict,
                "CONFLICT",
                ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred");

            var isDev = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";

            await WriteErrorAsync(
                context,
                HttpStatusCode.InternalServerError,
                "SERVER_ERROR",
                isDev
                    ? $"{ex.GetType().Name}: {ex.Message} | Inner: {ex.InnerException?.Message}"
                    : "An unexpected error occurred. Please try again later.");
        }
    }

    private static async Task WriteErrorAsync(
        HttpContext context,
        HttpStatusCode statusCode,
        string errorCode,
        string message,
        object? errors = null)
    {
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var response = new
        {
            success = false,
            error = new
            {
                code = errorCode,
                message = message,
                errors = errors
            },
            timestamp = DateTime.UtcNow
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition =
                System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        });

        await context.Response.WriteAsync(json);
    }
}