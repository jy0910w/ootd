using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OotdPlatform.Api.Contracts;
using OotdPlatform.Api.Services;
using System.Security.Claims;

namespace OotdPlatform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/recommendations")]
public sealed class RecommendationsController : ControllerBase
{
    private readonly InMemoryPlatformStore _store;

    public RecommendationsController(InMemoryPlatformStore store)
    {
        _store = store;
    }

    [HttpPost("query")]
    public ActionResult<RecommendationQueryResponse> Query([FromBody] RecommendationQueryRequest request)
    {
        var start = DateTimeOffset.UtcNow;
        var userId = User.GetRequiredUserId();

        var candidateOutfits = _store.GetOutfitsByStatus("approved").Take(10).ToArray();
        var fallback = _store.GetOutfitsByUser(userId).Take(10).ToArray();
        var selected = candidateOutfits.Length > 0 ? candidateOutfits : fallback;

        var results = selected
            .Select((outfit, index) => new RecommendationResult(
                outfit.Id,
                Math.Round(0.95m - (index * 0.03m), 2),
                ["同為目標場合", "季節相符", "可作為搭配參考"]))
            .ToArray();

        var latency = (int)Math.Max(1, (DateTimeOffset.UtcNow - start).TotalMilliseconds);
        var log = _store.CreateRecommendationLog(
            userId,
            request.ItemIds,
            request.Occasion,
            request.Season,
            request.Weather,
            request.StyleHints,
            latency,
            results.Select(x => x.OutfitId).ToArray());

        return Ok(new RecommendationQueryResponse(log.Id, results));
    }

    [HttpGet("{id:guid}")]
    public ActionResult<RecommendationDetailResponse> GetById([FromRoute] Guid id)
    {
        var log = _store.GetRecommendationLog(id);
        if (log is null)
        {
            return NotFound(new ApiErrorResponse("RECOMMENDATION_NOT_FOUND", "推薦紀錄不存在", null, HttpContext.TraceIdentifier));
        }

        var userId = User.GetRequiredUserId();
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "user";
        if (log.UserId != userId && role != "admin")
        {
            return Forbid();
        }

        var context = new RecommendationContext(log.Context.Occasion, log.Context.Season, log.Context.Weather, log.Context.StyleHints);
        return Ok(new RecommendationDetailResponse(log.Id, log.UserId, log.InputItemIds, context, log.ResultOutfitIds, log.LatencyMs, log.CreatedAt));
    }
}
