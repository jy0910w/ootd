using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OotdPlatform.Api.Contracts;
using OotdPlatform.Api.Services;

namespace OotdPlatform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/upload")]
public sealed class UploadController : ControllerBase
{
    private readonly CloudinaryService _cloudinary;
    private readonly ILogger<UploadController> _logger;

    public UploadController(CloudinaryService cloudinary, ILogger<UploadController> logger)
    {
        _cloudinary = cloudinary;
        _logger = logger;
    }

    /// <summary>
    /// 上傳圖片到 Cloudinary，回傳公開 HTTPS URL。
    /// 支援格式：jpg/png/webp/heic/heif，最大 10 MB。
    /// </summary>
    [HttpPost("image")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<UploadImageResponse>> UploadImage(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new ApiErrorResponse(
                "MISSING_FILE",
                "請提供要上傳的圖片檔案。",
                null,
                HttpContext.TraceIdentifier));
        }

        try
        {
            var result = await _cloudinary.UploadImageAsync(file);
            return Ok(new UploadImageResponse(result.Url, result.PublicId, result.Bytes));
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("圖片上傳驗證失敗: {Message}", ex.Message);
            return BadRequest(new ApiErrorResponse(
                "UPLOAD_VALIDATION_ERROR",
                ex.Message,
                null,
                HttpContext.TraceIdentifier));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError("圖片上傳至 Cloudinary 失敗: {Message}", ex.Message);
            return StatusCode(502, new ApiErrorResponse(
                "UPLOAD_FAILED",
                ex.Message,
                null,
                HttpContext.TraceIdentifier));
        }
    }
}
