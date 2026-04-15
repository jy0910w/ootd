using Mscc.GenerativeAI;
using Mscc.GenerativeAI.Types;

namespace OotdPlatform.Api.Services;

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

    private readonly string _apiKey;
    private readonly string _modelName;

    public GeminiService(IConfiguration configuration)
    {
        _apiKey = configuration["Gemini:ApiKey"] ?? throw new ArgumentNullException("API Key 缺失");
        _modelName = configuration["Gemini:ModelName"] ?? "gemini-2.5-flash";
    }

    public async Task<string> AnalyzeOutfitAsync(string imageUrl)
    {
        if (!Uri.TryCreate(imageUrl, UriKind.Absolute, out var parsed) ||
            (parsed.Scheme != Uri.UriSchemeHttp && parsed.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException("ImageUrl 必須是可公開存取的 http/https URL。", nameof(imageUrl));
        }

        var mimeType = GetSupportedImageMimeType(parsed.AbsolutePath)
            ?? await GetSupportedImageMimeTypeFromUrlAsync(imageUrl);

        if (mimeType is null)
        {
            throw new ArgumentException("不支援的圖片格式。請使用 jpg/jpeg/png/webp/heic/heif。", nameof(imageUrl));
        }

        var googleAi = new GoogleAI(_apiKey);
        var model = googleAi.GenerativeModel(_modelName);

        var prompt = "請分析這張穿搭圖片中的整體風格、主要單品、配色重點，最後提供 3 個適合的繁體中文標籤。";
        var request = new GenerateContentRequest(prompt);
        await request.AddMedia(imageUrl, mimeType, useOnline: false);

        var response = await model.GenerateContent(request);

        return response.Text ?? "AI 無法辨識";
    }

    private static string? GetSupportedImageMimeType(string absolutePath)
    {
        var extension = Path.GetExtension(absolutePath).ToLowerInvariant();
        return extension switch
        {
            ".jpg" => "image/jpeg",
            ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".heic" => "image/heic",
            ".heif" => "image/heif",
            _ => null
        };
    }

    private static async Task<string?> GetSupportedImageMimeTypeFromUrlAsync(string imageUrl)
    {
        var headMimeType = await TryGetContentTypeAsync(HttpMethod.Head, imageUrl);
        var normalizedHeadMimeType = NormalizeMimeType(headMimeType);
        if (normalizedHeadMimeType is not null)
        {
            return normalizedHeadMimeType;
        }

        var getMimeType = await TryGetContentTypeAsync(HttpMethod.Get, imageUrl);
        return NormalizeMimeType(getMimeType);
    }

    private static async Task<string?> TryGetContentTypeAsync(HttpMethod method, string imageUrl)
    {
        try
        {
            using var request = new HttpRequestMessage(method, imageUrl);
            using var response = await HttpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            return response.Content.Headers.ContentType?.MediaType;
        }
        catch
        {
            return null;
        }
    }

    private static string? NormalizeMimeType(string? mimeType)
    {
        if (string.IsNullOrWhiteSpace(mimeType))
        {
            return null;
        }

        if (mimeType.Equals("image/jpg", StringComparison.OrdinalIgnoreCase))
        {
            mimeType = "image/jpeg";
        }

        return SupportedMimeTypes.Contains(mimeType) ? mimeType : null;
    }
}
