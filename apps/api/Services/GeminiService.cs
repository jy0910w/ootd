using Mscc.GenerativeAI;
using Mscc.GenerativeAI.Types;
using System.Text.Json;

namespace OotdPlatform.Api.Services;

/// <summary>
/// AI 圖片分析結果：視覺推薦用（場合/季節/風格提示）
/// </summary>
public sealed record VisualContext(
    string Occasion,
    string Season,
    string[] StyleHints,
    string ColorPalette);

/// <summary>
/// AI 識別的單品
/// </summary>
public sealed record DetectedItem(
    string Name,
    string Category,
    string Color,
    string[] StyleHints);

/// <summary>
/// AI 識別穿搭的完整結果
/// </summary>
public sealed record DetectedOutfit(
    string Title,
    string Description,
    string Occasion,
    string Season,
    DetectedItem[] Items);

public class GeminiService
{
    private static readonly HttpClient HttpClient = new();
    private static readonly HashSet<string> SupportedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif"
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly string _apiKey;
    private readonly string _modelName;

    public GeminiService(IConfiguration configuration)
    {
        _apiKey = configuration["Gemini:ApiKey"] ?? throw new ArgumentNullException("API Key 缺失");
        _modelName = configuration["Gemini:ModelName"] ?? "gemini-2.5-flash";
    }

    /// <summary>
    /// 從圖片提取場合/季節/風格提示，用於視覺推薦（Landing Page 公開入口）。
    /// </summary>
    public async Task<VisualContext> ExtractVisualContextAsync(string imageUrl)
    {
        var mimeType = await ResolveMimeTypeAsync(imageUrl);
        var googleAi = new GoogleAI(_apiKey);
        var model = googleAi.GenerativeModel(_modelName);

        const string prompt = """
            請分析這張穿搭圖片，以 JSON 格式回傳以下欄位（全部使用英文小寫值）：
            {
              "occasion": "work | casual | formal | sport | outdoor | date",
              "season": "spring | summer | fall | winter | all-season",
              "styleHints": ["最多 4 個英文風格關鍵字，例如 minimal, vintage, streetwear, preppy"],
              "colorPalette": "一句簡短英文描述主色調，例如 earth tones, black and white, pastel"
            }
            只回傳 JSON，不要其他文字。
            """;

        var request = new GenerateContentRequest(prompt);
        await request.AddMedia(imageUrl, mimeType, useOnline: false);
        var response = await model.GenerateContent(request);
        var json = CleanJson(response.Text ?? "{}");

        try
        {
            var raw = JsonSerializer.Deserialize<JsonElement>(json);
            return new VisualContext(
                raw.GetStringOrDefault("occasion", "casual"),
                raw.GetStringOrDefault("season", "all-season"),
                raw.GetStringArrayOrDefault("styleHints"),
                raw.GetStringOrDefault("colorPalette", "mixed"));
        }
        catch
        {
            return new VisualContext("casual", "all-season", [], "mixed");
        }
    }

    /// <summary>
    /// 從穿搭圖片識別單品清單，用於穿搭上傳確認流程。
    /// </summary>
    public async Task<DetectedOutfit> DetectOutfitItemsAsync(string imageUrl)
    {
        var mimeType = await ResolveMimeTypeAsync(imageUrl);
        var googleAi = new GoogleAI(_apiKey);
        var model = googleAi.GenerativeModel(_modelName);

        const string prompt = """
            請仔細分析這張穿搭圖片，以 JSON 格式回傳識別結果：
            {
              "title": "為這套穿搭取一個繁體中文名稱（最多 20 字）",
              "description": "一句繁體中文描述穿搭整體風格（最多 50 字）",
              "occasion": "work | casual | formal | sport | outdoor | date",
              "season": "spring | summer | fall | winter | all-season",
              "items": [
                {
                  "name": "繁體中文單品名稱，如「白色寬版棉質T恤」",
                  "category": "top | bottom | outer | shoes | bag | accessory",
                  "color": "英文顏色名稱，如 white | navy | beige",
                  "styleHints": ["最多 2 個英文風格關鍵字"]
                }
              ]
            }
            items 列出圖片中所有可見的服裝單品，只回傳 JSON，不要其他文字。
            """;

        var request = new GenerateContentRequest(prompt);
        await request.AddMedia(imageUrl, mimeType, useOnline: false);
        var response = await model.GenerateContent(request);
        var json = CleanJson(response.Text ?? "{}");

        try
        {
            var raw = JsonSerializer.Deserialize<JsonElement>(json);
            var items = raw.TryGetProperty("items", out var itemsEl)
                ? itemsEl.EnumerateArray().Select(el => new DetectedItem(
                    el.GetStringOrDefault("name", "未知單品"),
                    el.GetStringOrDefault("category", "top"),
                    el.GetStringOrDefault("color", "unknown"),
                    el.GetStringArrayOrDefault("styleHints"))).ToArray()
                : [];

            return new DetectedOutfit(
                raw.GetStringOrDefault("title", "我的穿搭"),
                raw.GetStringOrDefault("description", ""),
                raw.GetStringOrDefault("occasion", "casual"),
                raw.GetStringOrDefault("season", "all-season"),
                items);
        }
        catch
        {
            return new DetectedOutfit("我的穿搭", "", "casual", "all-season", []);
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private async Task<string> ResolveMimeTypeAsync(string imageUrl)
    {
        if (!Uri.TryCreate(imageUrl, UriKind.Absolute, out var parsed) ||
            (parsed.Scheme != Uri.UriSchemeHttp && parsed.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException("ImageUrl 必須是可公開存取的 http/https URL。", nameof(imageUrl));
        }

        var mimeType = GetSupportedImageMimeType(parsed.AbsolutePath)
            ?? await GetSupportedImageMimeTypeFromUrlAsync(imageUrl);

        if (mimeType is null)
            throw new ArgumentException("不支援的圖片格式。請使用 jpg/jpeg/png/webp/heic/heif。", nameof(imageUrl));

        return mimeType;
    }

    private static string CleanJson(string text)
    {
        // Strip markdown code fences if Gemini wraps response in ```json ... ```
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start >= 0 && end > start)
            return text[start..(end + 1)];
        return text;
    }

    private static string? GetSupportedImageMimeType(string absolutePath)
    {
        var extension = Path.GetExtension(absolutePath).ToLowerInvariant();
        return extension switch
        {
            ".jpg"  => "image/jpeg",
            ".jpeg" => "image/jpeg",
            ".png"  => "image/png",
            ".webp" => "image/webp",
            ".heic" => "image/heic",
            ".heif" => "image/heif",
            _       => null
        };
    }

    private static async Task<string?> GetSupportedImageMimeTypeFromUrlAsync(string imageUrl)
    {
        var headMimeType = await TryGetContentTypeAsync(HttpMethod.Head, imageUrl);
        var normalizedHeadMimeType = NormalizeMimeType(headMimeType);
        if (normalizedHeadMimeType is not null)
            return normalizedHeadMimeType;

        var getMimeType = await TryGetContentTypeAsync(HttpMethod.Get, imageUrl);
        return NormalizeMimeType(getMimeType);
    }

    private static async Task<string?> TryGetContentTypeAsync(HttpMethod method, string imageUrl)
    {
        try
        {
            using var request = new HttpRequestMessage(method, imageUrl);
            using var response = await HttpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
            if (!response.IsSuccessStatusCode) return null;
            return response.Content.Headers.ContentType?.MediaType;
        }
        catch { return null; }
    }

    private static string? NormalizeMimeType(string? mimeType)
    {
        if (string.IsNullOrWhiteSpace(mimeType)) return null;
        if (mimeType.Equals("image/jpg", StringComparison.OrdinalIgnoreCase))
            mimeType = "image/jpeg";
        return SupportedMimeTypes.Contains(mimeType) ? mimeType : null;
    }
}

// ─── JsonElement extensions ───────────────────────────────────────────────────

internal static class JsonElementExtensions
{
    public static string GetStringOrDefault(this JsonElement el, string propertyName, string defaultValue)
    {
        if (el.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.String)
            return prop.GetString() ?? defaultValue;
        return defaultValue;
    }

    public static string[] GetStringArrayOrDefault(this JsonElement el, string propertyName)
    {
        if (el.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.Array)
            return prop.EnumerateArray()
                .Where(x => x.ValueKind == JsonValueKind.String)
                .Select(x => x.GetString()!)
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToArray();
        return [];
    }
}
