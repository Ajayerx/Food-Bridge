using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace FoodBridge.Application.Common.Behaviours;

public class LoggingBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehaviour<TRequest, TResponse>> _logger;

    public LoggingBehaviour(
        ILogger<LoggingBehaviour<TRequest, TResponse>> logger)
        => _logger = logger;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken ct)
    {
        var name = typeof(TRequest).Name;
        var sw = Stopwatch.StartNew();

        _logger.LogInformation("--> Handling {RequestName}", name);

        var response = await next();

        sw.Stop();

        if (sw.ElapsedMilliseconds > 500)
            _logger.LogWarning(
                "SLOW handler [{RequestName}] took {Elapsed}ms",
                name,
                sw.ElapsedMilliseconds);
        else
            _logger.LogInformation(
                "<-- {RequestName} handled in {Elapsed}ms",
                name,
                sw.ElapsedMilliseconds);

        return response;
    }
}