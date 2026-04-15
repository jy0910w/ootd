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

    public OutfitsController(InMemoryPlatformStore store)
    {
        _store = store;
    }

    [HttpGet("mine")]
    public ActionResult<PagedResponse<OutfitResponse>> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = User.GetRequiredUserId();
        var all = _store.GetOutfitsByUser(userId);
        var paged = all.Skip((page - 1) * pageSize).Take(pageSize).Select(ToResponse).ToArray();
        return Ok(new PagedResponse<OutfitResponse>(paged, page, pageSize, all.Count));
    }

    [HttpPost]
    public ActionResult<CreateOutfitResponse> Create([FromBody] CreateOutfitRequest request)
    {
        var userId = User.GetRequiredUserId();
        var outfit = _store.CreateOutfit(userId, request.Title, request.Description, request.Occasion, request.Season, request.WeatherRange, request.ImageUrls, request.ItemIds);
        return CreatedAtAction(nameof(GetById), new { id = outfit.Id }, new CreateOutfitResponse(outfit.Id, outfit.ModerationStatus));
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
