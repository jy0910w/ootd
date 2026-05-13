using System.ComponentModel.DataAnnotations;

namespace OotdPlatform.Api.Contracts;

public sealed record RecommendationQueryRequest(
    [Required, MinLength(1)] IReadOnlyCollection<Guid> ItemIds,
    [Required, MaxLength(30)] string Occasion,
    [Required, MaxLength(20)] string Season,
    [Required, MaxLength(30)] string Weather,
    IReadOnlyCollection<string>? StyleHints);

public sealed record RecommendationResult(Guid OutfitId, decimal Score, IReadOnlyCollection<string> Reasons);

public sealed record RecommendationQueryResponse(Guid RecommendationId, IReadOnlyCollection<RecommendationResult> Results);

public sealed record RecommendationDetailResponse(
    Guid Id,
    Guid UserId,
    IReadOnlyCollection<Guid> InputItemIds,
    RecommendationContext Context,
    IReadOnlyCollection<Guid> ResultOutfitIds,
    int LatencyMs,
    DateTimeOffset CreatedAt);

public sealed record RecommendationContext(string Occasion, string Season, string Weather, IReadOnlyCollection<string> StyleHints);

// ─── Item-based Recommendation (上傳單品照片 → 推薦穿搭) ───────────────────────

public sealed record ItemRecommendationRequest(
    [MaxLength(30)] string? Occasion,
    [MaxLength(20)] string? Season,
    [MaxLength(30)] string? Weather);

public sealed record DetectedItemInfo(
    Guid ItemId,
    string Name,
    string Category,
    string Color,
    IReadOnlyCollection<string> StyleHints);

public sealed record ItemRecommendationResponse(
    DetectedItemInfo DetectedItem,
    IReadOnlyCollection<OutfitBriefResponse> RecommendedOutfits);

// Brief outfit info for recommendation results
public sealed record OutfitBriefResponse(
    Guid Id,
    Guid UserId,
    string Title,
    string? Description,
    string Occasion,
    string Season,
    string? WeatherRange,
    string ImageUrl, // First image
    decimal Score,
    IReadOnlyCollection<string> Reasons);
