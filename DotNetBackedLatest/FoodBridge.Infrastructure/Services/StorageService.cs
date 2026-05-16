using FoodBridge.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace FoodBridge.Infrastructure.Services;

public class StorageService : IStorageService
{
    private readonly IConfiguration _config;

    public StorageService(IConfiguration config)
        => _config = config;

    public async Task<string> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder,
        CancellationToken ct = default)
    {
        var basePath = _config["Storage:LocalBasePath"]
                         ?? "wwwroot/uploads";
        var uploadPath = Path.Combine(basePath, folder);

        // Create folder if not exists
        if (!Directory.Exists(uploadPath))
            Directory.CreateDirectory(uploadPath);

        var filePath = Path.Combine(uploadPath, fileName);

        // Write file
        await using var output = File.Create(filePath);
        await fileStream.CopyToAsync(output, ct);

        // Return public URL
        return GetPublicUrl($"{folder}/{fileName}");
    }

    public async Task DeleteAsync(
        string fileUrl,
        CancellationToken ct = default)
    {
        var basePath = _config["Storage:LocalBasePath"]
                       ?? "wwwroot/uploads";
        var baseUrl = _config["Storage:BaseUrl"]
                       ?? string.Empty;

        // Convert URL → file path
        var relative = fileUrl
            .Replace(baseUrl, string.Empty)
            .TrimStart('/');

        var fullPath = Path.Combine(
            basePath,
            relative.Replace('/', Path.DirectorySeparatorChar));

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        await Task.CompletedTask;
    }

    public string GetPublicUrl(string filePath)
    {
        var baseUrl = _config["Storage:BaseUrl"]
                      ?? "https://localhost:5001/uploads";

        return $"{baseUrl.TrimEnd('/')}/{filePath.TrimStart('/')}";
    }
}