using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OotdPlatform.Api.Contracts;
using OotdPlatform.Api.Services;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace OotdPlatform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/items")]
public sealed class ItemsController : ControllerBase
{
    private readonly InMemoryPlatformStore _store;
    private readonly GeminiService _gemini;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ItemsController> _logger;

    public ItemsController(
        InMemoryPlatformStore store,
        GeminiService gemini,
        IServiceScopeFactory scopeFactory,
        ILogger<ItemsController> logger)
    {
        _store = store;
        _gemini = gemini;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    [HttpGet]
    public ActionResult<PagedResponse<ItemResponse>> GetList(
        [FromQuery] string? category,
        [FromQuery] string? color,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
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

        // 若有圖片且未提供 StyleTags，以背景任務呼叫 Gemini 分析並更新標籤
        if (!string.IsNullOrWhiteSpace(item.ImageUrl) && (item.StyleTags is null || item.StyleTags.Count == 0))
        {
            TriggerGeminiAnalysis(item.Id, item.ImageUrl);
        }

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

            // 若這次更新包含新圖片，觸發 Gemini 重新分析（覆蓋舊標籤）
            if (!string.IsNullOrWhiteSpace(request.ImageUrl))
            {
                TriggerGeminiAnalysis(item.Id, item.ImageUrl);
            }

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
        return _store.ArchiveItem(id, userId)
            ? NoContent()
            : NotFound(new ApiErrorResponse("ITEM_NOT_FOUND", "單品不存在", null, HttpContext.TraceIdentifier));
    }

    /// <summary>
    /// 以 fire-and-forget 方式背景執行 Gemini 圖片分析，不阻塞 API 回應。
    /// 分析完成後解析出標籤並更新資料庫。
    /// </summary>
    private void TriggerGeminiAnalysis(Guid itemId, string imageUrl)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                _logger.LogInformation("Gemini 開始分析圖片 ItemId={ItemId}", itemId);

                // 使用新 scope 避免在請求結束後 DbContext 被 Dispose
                await using var scope = _scopeFactory.CreateAsyncScope();
                var gemini = scope.ServiceProvider.GetRequiredService<GeminiService>();
                var store = scope.ServiceProvider.GetRequiredService<InMemoryPlatformStore>();

                var analysisText = await gemini.AnalyzeOutfitAsync(imageUrl);
                var tags = ExtractTagsFromAnalysis(analysisText);

                if (tags.Count > 0)
                {
                    store.UpdateItemStyleTagsBackground(itemId, tags);
                    _logger.LogInformation("Gemini 分析完成 ItemId={ItemId}, Tags=[{Tags}]", itemId, string.Join(", ", tags));
                }
                else
                {
                    _logger.LogWarning("Gemini 未能提取有效標籤 ItemId={ItemId}, Response={Response}", itemId, analysisText);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Gemini 背景分析失敗 ItemId={ItemId}", itemId);
                // 靜默失敗，不影響使用者體驗
            }
        });
    }

    /// <summary>
    /// 從 Gemini 回傳文字中解析 # 開頭的繁體中文標籤。
    /// 例如："建議標籤：#街頭、#黑白配色、#休閒" → ["街頭", "黑白配色", "休閒"]
    /// </summary>
    private static IReadOnlyCollection<string> ExtractTagsFromAnalysis(string analysisText)
    {
        if (string.IsNullOrWhiteSpace(analysisText)) return [];

        var matches = Regex.Matches(analysisText, @"#([\w\u4e00-\u9fff\u3000-\u303f]+)");
        return matches
            .Select(m => m.Groups[1].Value.Trim())
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Distinct()
            .Take(5)
            .ToArray();
    }

    private static ItemResponse ToResponse(PlatformItem item)
        => new(item.Id, item.UserId, item.Name, item.Category, item.Color, item.StyleTags, item.ImageUrl, item.Status, item.CreatedAt, item.UpdatedAt);
}
