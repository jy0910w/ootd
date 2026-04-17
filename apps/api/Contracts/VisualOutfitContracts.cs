using System.ComponentModel.DataAnnotations;

namespace OotdPlatform.Api.Contracts;

// ─── Upload Outfit (Step 1: AI analysis → draft saved) ───────────────────────

/// <summary>AI 識別的單品草稿（含 DB 中的暫存 ID）</summary>
public sealed record DraftItemResponse(
    Guid Id,
    string Name,
    string Category,
    string Color,
    string[] StyleHints,
    string ImageUrl);

/// <summary>穿搭上傳後的 AI 分析結果草稿</summary>
public sealed record OutfitUploadResponse(
    Guid DraftId,
    string ImageUrl,
    string Title,
    string Description,
    string Occasion,
    string Season,
    IReadOnlyCollection<DraftItemResponse> Items);

// ─── Confirm Outfit (Step 2: user confirms / edits draft) ────────────────────

/// <summary>使用者確認（或編輯後）的單品資料</summary>
public sealed record ConfirmItemRequest(
    /// <summary>若為現有草稿單品則帶 Id；使用者新增的則不帶</summary>
    Guid? Id,
    [Required, MaxLength(120)] string Name,
    [Required, MaxLength(30)] string Category,
    [Required, MaxLength(30)] string Color,
    IReadOnlyCollection<string>? StyleHints);

/// <summary>使用者確認穿搭草稿的請求</summary>
public sealed record ConfirmOutfitRequest(
    [Required, MaxLength(140)] string Title,
    [MaxLength(2000)] string? Description,
    [Required, MaxLength(30)] string Occasion,
    [Required, MaxLength(20)] string Season,
    [MaxLength(30)] string? WeatherRange,
    /// <summary>最終確認的單品清單（Id 存在 = 更新草稿；Id 為 null = 新增；原草稿中不在此清單的 = 刪除）</summary>
    IReadOnlyCollection<ConfirmItemRequest> Items);

// ─── Visual Recommendation (public, no auth) ─────────────────────────────────

/// <summary>視覺推薦的 AI 分析摘要</summary>
public sealed record VisualAnalysisSummary(
    string Occasion,
    string Season,
    IReadOnlyCollection<string> StyleHints,
    string ColorPalette);

/// <summary>視覺推薦回應</summary>
public sealed record VisualRecommendationResponse(
    VisualAnalysisSummary Analysis,
    IReadOnlyCollection<RecommendationResult> Results);
