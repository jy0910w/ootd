using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OotdPlatform.Api.Contracts;
using OotdPlatform.Api.Services;
using System.Security.Claims;

namespace OotdPlatform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/items")]
public sealed class ItemsController : ControllerBase
{
    private readonly InMemoryPlatformStore _store;

    public ItemsController(InMemoryPlatformStore store)
    {
        _store = store;
    }

    [HttpGet]
    public ActionResult<PagedResponse<ItemResponse>> GetList([FromQuery] string? category, [FromQuery] string? color, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = User.GetRequiredUserId();
        var items = _store.GetItems(userId, category, color);
        var total = items.Count;
        var paged = items.Skip((page - 1) * pageSize).Take(pageSize).Select(ToResponse).ToArray();
        return Ok(new PagedResponse<ItemResponse>(paged, page, pageSize, total));
    }

    [HttpPost]
    public ActionResult<ItemResponse> Create([FromBody] CreateItemRequest request)
    {
        var userId = User.GetRequiredUserId();
        var item = _store.CreateItem(userId, request.Name, request.Category, request.Color, request.StyleTags, request.ImageUrl);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, ToResponse(item));
    }

    [HttpGet("{id:guid}")]
    public ActionResult<ItemResponse> GetById([FromRoute] Guid id)
    {
        var userId = User.GetRequiredUserId();
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "user";
        var item = _store.GetItem(id);
        if (item is null)
        {
            return NotFound(new ApiErrorResponse("ITEM_NOT_FOUND", "單品不存在", null, HttpContext.TraceIdentifier));
        }

        if (item.UserId != userId && role != "admin")
        {
            return Forbid();
        }

        return Ok(ToResponse(item));
    }

    [HttpPatch("{id:guid}")]
    public ActionResult<ItemResponse> Update([FromRoute] Guid id, [FromBody] UpdateItemRequest request)
    {
        try
        {
            var userId = User.GetRequiredUserId();
            var item = _store.UpdateItem(id, userId, request.Name, request.Category, request.Color, request.StyleTags, request.ImageUrl, request.Status);
            return Ok(ToResponse(item));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorResponse("ITEM_NOT_FOUND", "單品不存在", null, HttpContext.TraceIdentifier));
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
        return _store.ArchiveItem(id, userId) ? NoContent() : NotFound(new ApiErrorResponse("ITEM_NOT_FOUND", "單品不存在", null, HttpContext.TraceIdentifier));
    }

    private static ItemResponse ToResponse(PlatformItem item)
        => new(item.Id, item.UserId, item.Name, item.Category, item.Color, item.StyleTags, item.ImageUrl, item.Status, item.CreatedAt, item.UpdatedAt);
}
