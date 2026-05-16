namespace FoodBridge.Application.Common.Interfaces;

public interface IStorageService
{
    Task<string> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder,
        CancellationToken ct = default);

    Task DeleteAsync(string fileUrl, CancellationToken ct = default);

    string GetPublicUrl(string filePath);
}