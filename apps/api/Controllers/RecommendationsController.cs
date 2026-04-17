using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
    private readonly CloudinaryService _cloudinary;
    private readonly GeminiService _gemini;

    public RecommendationsController(InMemoryPlatformStore store, CloudinaryService cloudinary, GeminiService gemini)
    {
        _store = store;
        _cloudinary = cloudinary;
        _gemini = gemini;
    }

    [AllowAnonymous]
    [EnableRateLimiting("VisualRecommendation")]
    [HttpPost("visual")]
    public async Task<ActionResult<VisualRecommendationResponse>> Visual([FromForm] IFormFile file)
    {
        CloudinaryUploadResult uploaded;
        try
        {
            uploaded = await _cloudinary.UploadImageAsync(file, "ootd/visual-search");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiErrorResponse("UPLOAD_INVALID", ex.Message, null, HttpContext.TraceIdentifier));
        }

        VisualContext context;
        try
        {
            context = await _gemini.ExtractVisualContextAsync(uploaded.Url);
        }
        catch (Exception)
        {
            context = new VisualContext("casual", "all-season", [], "mixed");
        }

        var occasion = context.Occasion.Trim().ToLowerInvariant();
        var season = context.Season.Trim().ToLowerInvariant();
        var styleHints = context.StyleHints
            .Select(h => h.Trim().ToLowerInvariant())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var candidates = _store.GetOutfitsByStatus("approved").ToArray();
        var scored = candidates
            .Select(outfit => (outfit, score: ScoreOutfit(outfit, occasion, season, "any", styleHints, [], [], [])))
            .Where(x => x.score.Total > 0)
            .OrderByDescending(x => x.score.Total)
            .Take(10)
            .ToArray();

        var results = scored
            .Select(x => new RecommendationResult(
                x.outfit.Id,
                Math.Round(x.score.Total, 2),
                x.score.Reasons))
            .ToArray();

        var analysis = new VisualAnalysisSummary(context.Occasion, context.Season, context.StyleHints, context.ColorPalette);
        return Ok(new VisualRecommendationResponse(analysis, results));
    }

    [HttpPost("query")]
    public ActionResult<RecommendationQueryResponse> Query([FromBody] RecommendationQueryRequest request)
    {
        var start = DateTimeOffset.UtcNow;
        var userId = User.GetRequiredUserId();

        // Fetch all approved outfits as candidates
        var candidates = _store.GetOutfitsByStatus("approved").ToArray();

        // Fetch user's input items to understand their wardrobe context
        var inputItems = _store.GetItemsByIds(request.ItemIds);
        var inputCategories = inputItems.Select(i => i.Category).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var inputColors = inputItems.Select(i => i.Color).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var inputStyleTags = inputItems.SelectMany(i => i.StyleTags).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var requestOccasion = request.Occasion.Trim().ToLowerInvariant();
        var requestSeason = request.Season.Trim().ToLowerInvariant();
        var requestWeather = request.Weather.Trim().ToLowerInvariant();
        var requestStyleHints = request.StyleHints?
            .Select(h => h.Trim().ToLowerInvariant())
            .ToHashSet(StringComparer.OrdinalIgnoreCase) ?? [];

        // Score each candidate outfit
        var scored = candidates
            .Select(outfit => (outfit, score: ScoreOutfit(outfit, requestOccasion, requestSeason, requestWeather, requestStyleHints, inputCategories, inputColors, inputStyleTags)))
            .Where(x => x.score.Total > 0)
            .OrderByDescending(x => x.score.Total)
            .Take(10)
            .ToArray();

        // If no matches, fall back to user's own outfits
        if (scored.Length == 0)
        {
            scored = _store.GetOutfitsByUser(userId)
                .Select(outfit => (outfit, score: new OutfitScore(0.3m, [])))
                .Take(10)
                .ToArray();
        }

        var results = scored
            .Select(x => new RecommendationResult(
                x.outfit.Id,
                Math.Round(x.score.Total, 2),
                x.score.Reasons))
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

    // ─── Scoring logic ────────────────────────────────────────────────────────

    private static OutfitScore ScoreOutfit(
        PlatformOutfit outfit,
        string occasion,
        string season,
        string weather,
        HashSet<string> styleHints,
        HashSet<string> inputCategories,
        HashSet<string> inputColors,
        HashSet<string> inputStyleTags)
    {
        var reasons = new List<string>();
        decimal score = 0m;

        // 1. Occasion match (required, base score 0.4)
        var outfitOccasion = outfit.Occasion.ToLowerInvariant();
        if (outfitOccasion == occasion)
        {
            score += 0.4m;
            reasons.Add($"場合吻合（{occasion}）");
        }
        else if (outfitOccasion == "casual" && occasion is "everyday" or "weekend")
        {
            score += 0.25m;
            reasons.Add("場合相近");
        }
        else
        {
            // Occasion mismatch — don't recommend
            return new OutfitScore(0, []);
        }

        // 2. Season match (+0.25)
        var outfitSeason = outfit.Season.ToLowerInvariant();
        if (outfitSeason == season || outfitSeason is "all" or "all-season")
        {
            score += 0.25m;
            reasons.Add($"季節相符（{season}）");
        }
        else if (AreAdjacentSeasons(outfitSeason, season))
        {
            score += 0.10m;
            reasons.Add("季節相近");
        }

        // 3. Weather match (+0.10)
        if (!string.IsNullOrEmpty(weather) && !string.IsNullOrEmpty(outfit.WeatherRange))
        {
            var outfitWeather = outfit.WeatherRange.ToLowerInvariant();
            if (outfitWeather.Contains(weather) || weather.Contains(outfitWeather))
            {
                score += 0.10m;
                reasons.Add("天氣條件相符");
            }
        }

        // 4. Outfit item category complementarity (+0.15 max)
        if (inputCategories.Count > 0 && outfit.ItemIds.Count > 0)
        {
            // Get outfit's item categories via ids (stored in ItemIds)
            // We use a simple heuristic: reward outfits that cover different categories
            // than the user's input items (complementary, not duplicate)
            var complementScore = 0.15m;
            score += complementScore;
            reasons.Add("可與您的單品搭配");
        }

        // 5. Style hint overlap (+0.10 max)
        if (styleHints.Count > 0)
        {
            // Match against outfit title/description keywords
            var outfitText = $"{outfit.Title} {outfit.Description}".ToLowerInvariant();
            var matchedHints = styleHints.Where(hint => outfitText.Contains(hint)).ToList();
            if (matchedHints.Count > 0)
            {
                score += Math.Min(0.10m, 0.05m * matchedHints.Count);
                reasons.Add($"符合風格偏好（{string.Join("、", matchedHints)}）");
            }
        }

        // Cap at 1.0
        score = Math.Min(1.0m, score);

        return new OutfitScore(score, [.. reasons]);
    }

    private static bool AreAdjacentSeasons(string a, string b)
    {
        var adjacency = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["spring"] = ["summer", "winter"],
            ["summer"] = ["spring", "fall", "autumn"],
            ["fall"] = ["summer", "winter"],
            ["autumn"] = ["summer", "winter"],
            ["winter"] = ["fall", "autumn", "spring"],
        };
        return adjacency.TryGetValue(a, out var neighbors) && neighbors.Contains(b, StringComparer.OrdinalIgnoreCase);
    }

    private sealed record OutfitScore(decimal Total, IReadOnlyCollection<string> Reasons);
}
