using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace OotdPlatform.Api.Services;

public sealed class CloudinaryService
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryService> _logger;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif"
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    public CloudinaryService(IConfiguration configuration, ILogger<CloudinaryService> logger)
    {
        _logger = logger;

        var cloudName = configuration["Cloudinary:CloudName"]
            ?? throw new ArgumentNullException("Cloudinary:CloudName", "Cloudinary CloudName 缺失");
        var apiKey = configuration["Cloudinary:ApiKey"]
            ?? throw new ArgumentNullException("Cloudinary:ApiKey", "Cloudinary ApiKey 缺失");
        var apiSecret = configuration["Cloudinary:ApiSecret"]
            ?? throw new ArgumentNullException("Cloudinary:ApiSecret", "Cloudinary ApiSecret 缺失");

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account) { Api = { Secure = true } };
    }

    /// <summary>
    /// 上傳圖片到 Cloudinary，回傳公開 HTTPS URL。
    /// </summary>
    public async Task<CloudinaryUploadResult> UploadImageAsync(IFormFile file, string folder = "ootd/items")
    {
        if (file.Length == 0)
        {
            throw new ArgumentException("檔案不可為空。", nameof(file));
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new ArgumentException($"檔案大小不可超過 {MaxFileSizeBytes / 1024 / 1024} MB。", nameof(file));
        }

        var contentType = file.ContentType;
        if (!AllowedContentTypes.Contains(contentType))
        {
            throw new ArgumentException($"不支援的圖片格式：{contentType}。請使用 jpg/png/webp/heic/heif。", nameof(file));
        }

        await using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,
            UseFilename = false,
            UniqueFilename = true,
            Overwrite = false,
            Transformation = new Transformation()
                .Width(1200).Height(1600).Crop("limit")
                .Quality("auto:good")
                .FetchFormat("auto")
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error is not null)
        {
            _logger.LogError("Cloudinary 上傳失敗: {Message}", result.Error.Message);
            throw new InvalidOperationException($"圖片上傳失敗：{result.Error.Message}");
        }

        _logger.LogInformation("圖片上傳成功: {PublicId} -> {Url}", result.PublicId, result.SecureUrl);

        return new CloudinaryUploadResult(result.SecureUrl.ToString(), result.PublicId, result.Bytes);
    }
}

public sealed record CloudinaryUploadResult(string Url, string PublicId, long Bytes);
