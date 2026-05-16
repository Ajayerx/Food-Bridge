// UploadFileCommandHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Upload;
using MediatR;
namespace FoodBridge.Application.Features.Upload.Commands.UploadFile;

public class UploadFileCommandHandler
    : IRequestHandler<UploadFileCommand, UploadResponseDto>
{
    private readonly IStorageService _storage;

    public UploadFileCommandHandler(IStorageService storage)
        => _storage = storage;

    public async Task<UploadResponseDto> Handle(
        UploadFileCommand request,
        CancellationToken ct)
    {
        // 1. Sanitize file name
        var ext = Path.GetExtension(request.FileName);
        var safeName = $"{Guid.NewGuid():N}{ext}";
        var folderPath = request.Folder.Trim('/').ToLower();

        // 2. Upload to storage
        var url = await _storage.UploadAsync(
            request.FileStream,
            safeName,
            request.ContentType,
            folderPath,
            ct);

        // 3. Get file size
        var sizeInBytes = request.FileStream.CanSeek
            ? request.FileStream.Length
            : 0;

        return new UploadResponseDto
        {
            Url = url,
            FileName = safeName,
            ContentType = request.ContentType,
            SizeInBytes = sizeInBytes,
            Folder = folderPath,
            UploadedAt = DateTime.UtcNow
        };
    }
}