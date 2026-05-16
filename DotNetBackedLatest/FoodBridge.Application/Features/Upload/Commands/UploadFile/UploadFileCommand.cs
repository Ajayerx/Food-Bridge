// UploadFileCommand.cs
using FoodBridge.Application.DTOs.Upload;
using MediatR;
namespace FoodBridge.Application.Features.Upload.Commands.UploadFile;

public record UploadFileCommand(
    Stream FileStream,
    string FileName,
    string ContentType,
    string Folder,
    Guid UploadedByUserId)
    : IRequest<UploadResponseDto>;