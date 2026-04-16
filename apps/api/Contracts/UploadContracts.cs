namespace OotdPlatform.Api.Contracts;

public sealed record UploadImageResponse(
    string Url,
    string PublicId,
    long Bytes);
