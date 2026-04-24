using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OotdPlatform.Api.Contracts;
using OotdPlatform.Api.Services;
using System.Security.Claims;

namespace OotdPlatform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/outfits")]
public sealed class OutfitsController : ControllerBase
{
    private readonly InMemoryPlatformStore _store;
    private readonly CloudinaryService _cloudinary;
    private readonly GeminiService _gemini;

    public OutfitsController(InMemoryPlatformStore store, CloudinaryService cloudinary, GeminiService gemini)
    {
        _store = store;
        _cloudinary = cloudinary;
        _gemini = gemini;
    }

    [HttpGet("mine")]
    public ActionResult<PagedResponse<OutfitResponse>> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = User.GetRequiredUserId();
        var all = _store.GetOutfitsByUser(userId);
        var paged = all.Skip((page - 1) * pageSize).Take(pageSize).Select(ToResponse).ToArray();
        return Ok(new PagedResponse<OutfitResponse>(paged, page, pageSize, all.Count));
    }

    /// <summary>
    /// Step 1：上傳穿搭圖片 → Cloudinary → Gemini 識別單品 → 儲存草稿 → 回傳草稿供前端確認
    /// </summary>
    [HttpPost("upload")]
    public async Task<ActionResult<OutfitUploadResponse>> Upload([FromForm] IFormFile file)
    {
        var userId = User.GetRequiredUserId();

        CloudinaryUploadResult uploaded;
        try
        {
            uploaded = await _cloudinary.UploadImageAsync(file, "ootd/outfits");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiErrorResponse("UPLOAD_INVALID", ex.Message, null, HttpContext.TraceIdentifier));
        }

        DetectedOutfit detected;
        try
        {
            detected = await _gemini.DetectOutfitItemsAsync(uploaded.Url);
        }
        catch (Exception)
        {
            detected = new DetectedOutfit("我的穿搭", "", "casual", "all-season", []);
        }

        var (outfit, draftItems) = _store.CreateDraftOutfit(userId, uploaded.Url, detected);

        var draftItemResponses = draftItems.Select(i => new DraftItemResponse(
            i.Id, i.Name, i.Category, i.Color,
            i.StyleTags.ToArray(),
            i.ImageUrl)).ToArray();

        return Ok(new OutfitUploadResponse(
            outfit.Id,
            uploaded.Url,
            outfit.Title,
            outfit.Description ?? "",
            outfit.Occasion,
            outfit.Season,
            draftItemResponses));
    }

    /// <summary>
    /// Step 2：使用者確認（或編輯）草稿 → 建立正式 Outfit + WardrobeItems
    /// </summary>
    [HttpPost("{id:guid}/confirm")]
    public ActionResult<OutfitResponse> Confirm([FromRoute] Guid id, [FromBody] ConfirmOutfitRequest request)
    {
        var userId = User.GetRequiredUserId();

        var items = request.Items.Select(i =>
            (i.Id, i.Name, i.Category, i.Color, (IReadOnlyCollection<string>?)i.StyleHints)
        ).ToArray();

        try
        {
            var confirmed = _store.ConfirmDraftOutfit(id, userId, request.Title, request.Description, request.Occasion, request.Season, request.WeatherRange, items);
            return Ok(ToResponse(confirmed));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorResponse("OUTFIT_NOT_FOUND", "草稿穿搭不存在", null, HttpContext.TraceIdentifier));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex) when (ex.Message == "OUTFIT_NOT_DRAFT")
        {
            return Conflict(new ApiErrorResponse("OUTFIT_NOT_DRAFT", "此穿搭已非草稿狀態", null, HttpContext.TraceIdentifier));
        }
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public ActionResult<OutfitResponse> GetById([FromRoute] Guid id)
    {
        var outfit = _store.GetOutfit(id);
        if (outfit is null)
        {
            return NotFound(new ApiErrorResponse("OUTFIT_NOT_FOUND", "穿搭不存在", null, HttpContext.TraceIdentifier));
        }

        if (!CanReadOutfit(outfit))
        {
            return Forbid();
        }

        return Ok(ToResponse(outfit));
    }

    [HttpPatch("{id:guid}")]
    public ActionResult<OutfitResponse> Patch([FromRoute] Guid id, [FromBody] UpdateOutfitRequest request)
    {
        try
        {
            var userId = User.GetRequiredUserId();
            var updated = _store.UpdateOutfit(id, userId, request.Title, request.Description, request.Occasion, request.Season, request.WeatherRange, request.ImageUrls, request.ItemIds);
            return Ok(ToResponse(updated));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorResponse("OUTFIT_NOT_FOUND", "穿搭不存在", null, HttpContext.TraceIdentifier));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id:guid}/upload-image")]
    public async Task<ActionResult<string>> UploadImage([FromRoute] Guid id, [FromForm] IFormFile file)
    {
        var userId = User.GetRequiredUserId();
        
        var outfit = _store.GetOutfit(id);
        if (outfit is null)
        {
            return NotFound(new ApiErrorResponse("OUTFIT_NOT_FOUND", "穿搭不存在", null, HttpContext.TraceIdentifier));
        }

        if (outfit.UserId != userId)
        {
            return Forbid();
        }

        try
        {
            var uploaded = await _cloudinary.UploadImageAsync(file, "ootd/outfits");
            return Ok(uploaded.Url);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiErrorResponse("UPLOAD_INVALID", ex.Message, null, HttpContext.TraceIdentifier));
        }
    }

    [HttpDelete("{id:guid}")]
    public ActionResult Delete([FromRoute] Guid id)
    {
        var userId = User.GetRequiredUserId();
        return _store.DeleteOutfit(id, userId)
            ? NoContent()
            : NotFound(new ApiErrorResponse("OUTFIT_NOT_FOUND", "穿搭不存在", null, HttpContext.TraceIdentifier));
    }

    private bool CanReadOutfit(PlatformOutfit outfit)
    {
        if (outfit.ModerationStatus == "approved")
        {
            return true;
        }

        if (User?.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        var role = User.FindFirstValue(ClaimTypes.Role) ?? "user";
        var userId = User.GetRequiredUserId();
        return outfit.UserId == userId || role is "moderator" or "admin";
    }

    private static OutfitResponse ToResponse(PlatformOutfit outfit)
        => new(
            outfit.Id,
            outfit.UserId,
            outfit.Title,
            outfit.Description,
            outfit.Occasion,
            outfit.Season,
            outfit.WeatherRange,
            outfit.ImageUrls,
            outfit.ItemIds,
            outfit.ModerationStatus,
            outfit.CreatedAt,
            outfit.UpdatedAt);
}
