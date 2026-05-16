using FoodBridge.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace FoodBridge.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IMemoryCache _cache;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public CacheService(IMemoryCache cache )
    {
        _cache = cache;
    }

    public Task<T?> GetAsync<T>(
        string key,
        CancellationToken ct = default)
    {

        if (!_cache.TryGetValue(key, out string json))
            return Task.FromResult(default(T));

        return Task.FromResult(
            JsonSerializer.Deserialize<T>(json, _jsonOptions));
    }

    public Task SetAsync<T>(
        string key,
        T value,
        TimeSpan? expiry = null,
        CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(value, _jsonOptions);

        _cache.Set(
            key,
            json,
            expiry ?? TimeSpan.FromMinutes(5));

        return Task.CompletedTask;
    }

    public Task RemoveAsync(
        string key,
        CancellationToken ct = default)
    {
        _cache.Remove(key);
        return Task.CompletedTask;
    }

    public Task RemoveByPatternAsync(
        string pattern,
        CancellationToken ct = default)
    {
        return Task.CompletedTask;
    }

    public async Task<T> GetOrSetAsync<T>(
        string key,
        Func<Task<T>> factory,
        TimeSpan? expiry = null,
        CancellationToken ct = default)
    {
        var cached = await GetAsync<T>(key, ct);

        if (cached is not null)
            return cached;

        var value = await factory();

        await SetAsync(key, value, expiry, ct);

        return value;
    }
}