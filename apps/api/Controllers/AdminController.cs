using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OotdPlatform.Api.Contracts;
using OotdPlatform.Api.Services;

namespace OotdPlatform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/admin")]
public sealed class AdminController : ControllerBase
{
    private readonly InMemoryPlatformStore _store;

    public AdminController(InMemoryPlatformStore store)
    {
        _store = store;
    }

    [HttpGet("moderation/outfits")]
    [Authorize(Roles = "moderator,admin")]
    public ActionResult<PagedResponse<OutfitResponse>> GetModerationOutfits([FromQuery] string status = "pending", [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var outfits = _store.GetOutfitsByStatus(status);
        var paged = outfits.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(outfit => new OutfitResponse(
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
                outfit.UpdatedAt))
            .ToArray();

        return Ok(new PagedResponse<OutfitResponse>(paged, page, pageSize, outfits.Count));
    }

    [HttpPost("moderation/outfits/{id:guid}/approve")]
    [Authorize(Roles = "moderator,admin")]
    public ActionResult<AdminActionResponse> ApproveOutfit([FromRoute] Guid id)
    {
        try
        {
            _store.ModerateOutfit(id, User.GetRequiredUserId(), "approve", null);
            return Ok(new AdminActionResponse(true));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorResponse("OUTFIT_NOT_FOUND", "穿搭不存在", null, HttpContext.TraceIdentifier));
        }
    }

    [HttpPost("moderation/outfits/{id:guid}/reject")]
    [Authorize(Roles = "moderator,admin")]
    public ActionResult<AdminActionResponse> RejectOutfit([FromRoute] Guid id, [FromBody] RejectOutfitRequest request)
    {
        try
        {
            _store.ModerateOutfit(id, User.GetRequiredUserId(), "reject", request.Reason);
            return Ok(new AdminActionResponse(true));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorResponse("OUTFIT_NOT_FOUND", "穿搭不存在", null, HttpContext.TraceIdentifier));
        }
    }

    [HttpGet("users")]
    [Authorize(Roles = "admin")]
    public ActionResult<PagedResponse<AdminUserResponse>> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var users = _store.GetUsers(page, pageSize)
            .Select(user => new AdminUserResponse(user.Id, user.Email, user.DisplayName, user.Role, user.Status, user.CreatedAt))
            .ToArray();

        return Ok(new PagedResponse<AdminUserResponse>(users, page, pageSize, _store.GetUsersTotal()));
    }

    [HttpPost("users/{id:guid}/ban")]
    [Authorize(Roles = "admin")]
    public ActionResult<AdminActionResponse> BanUser([FromRoute] Guid id)
    {
        try
        {
            _store.UpdateUserStatus(id, "banned", User.GetRequiredUserId());
            return Ok(new AdminActionResponse(true));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorResponse("USER_NOT_FOUND", "使用者不存在", null, HttpContext.TraceIdentifier));
        }
    }

    [HttpPost("users/{id:guid}/unban")]
    [Authorize(Roles = "admin")]
    public ActionResult<AdminActionResponse> UnbanUser([FromRoute] Guid id)
    {
        try
        {
            _store.UpdateUserStatus(id, "active", User.GetRequiredUserId());
            return Ok(new AdminActionResponse(true));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorResponse("USER_NOT_FOUND", "使用者不存在", null, HttpContext.TraceIdentifier));
        }
    }
}
