using FoodBridge.Application.Features.Upload.Commands.UploadFile;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1/upload")]
[Authorize]
public class UploadController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public UploadController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    /// <summary>POST v1/upload/image — Upload a single image</summary>
    [HttpPost("image")]
    public async Task<IActionResult> UploadImage(
        IFormFile file,
        [FromQuery] string folder = "general",
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, message = "No file provided" });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { success = false, message = "File size must be under 5MB" });

        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest(new { success = false, message = "Only JPEG, PNG and WEBP images are allowed" });

        using var stream = file.OpenReadStream();

        var result = await _mediator.Send(
            new UploadFileCommand(
                stream,
                file.FileName,
                file.ContentType,
                folder,
                _currentUser.UserId!.Value), ct);

        return Ok(new { success = true, data = result });
    }

    /// <summary>POST v1/upload/images — Upload multiple images</summary>
    [HttpPost("images")]
    public async Task<IActionResult> UploadImages(
        List<IFormFile> files,
        [FromQuery] string folder = "general",
        CancellationToken ct = default)
    {
        if (files == null || files.Count == 0)
            return BadRequest(new { success = false, message = "No files provided" });

        if (files.Count > 5)
            return BadRequest(new { success = false, message = "Maximum 5 files allowed at once" });

        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
        var urls = new List<string>();

        foreach (var file in files)
        {
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { success = false, message = $"{file.FileName} exceeds 5MB limit" });

            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                return BadRequest(new { success = false, message = $"{file.FileName} is not a valid image type" });

            using var stream = file.OpenReadStream();

            var result = await _mediator.Send(
                new UploadFileCommand(
                    stream,
                    file.FileName,
                    file.ContentType,
                    folder,
                    _currentUser.UserId!.Value), ct);

            urls.Add(result.Url);
        }

        return Ok(new { success = true, data = new { urls } });
    }
}