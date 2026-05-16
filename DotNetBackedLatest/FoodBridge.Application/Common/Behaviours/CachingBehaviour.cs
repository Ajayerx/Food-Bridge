using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FoodBridge.Application.Common.Behaviours;

public interface ICacheable
{
    string CacheKey { get; }
    TimeSpan Expiry { get; }
}

public class CachingBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : ICacheable
{
    private readonly ICacheService _cache;
    private readonly ILogger<CachingBehaviour<TRequest, TResponse>> _logger;

    public CachingBehaviour(
        ICacheService cache,
        ILogger<CachingBehaviour<TRequest, TResponse>> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken ct)
    {
        var key = request.CacheKey;

        var cached = await _cache.GetAsync<TResponse>(key, ct);
        if (cached is not null)
        {
            _logger.LogInformation("Cache HIT: {Key}", key);
            return cached;
        }

        _logger.LogInformation("Cache MISS: {Key}", key);

        var response = await next();

        await _cache.SetAsync(key, response, request.Expiry, ct);

        return response;
    }
}