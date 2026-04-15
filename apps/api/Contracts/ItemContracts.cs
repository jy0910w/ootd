using System.ComponentModel.DataAnnotations;

namespace OotdPlatform.Api.Contracts;

public sealed record CreateItemRequest(
    [property: Required, MaxLength(120)] string Name,
    [property: Required, MaxLength(30)] string Category,
    [property: Required, MaxLength(30)] string Color,
    IReadOnlyCollection<string>? StyleTags,
    [property: Required, Url] string ImageUrl);

public sealed record UpdateItemRequest(
    [property: MaxLength(120)] string? Name,
    [property: MaxLength(30)] string? Category,
    [property: MaxLength(30)] string? Color,
    IReadOnlyCollection<string>? StyleTags,
    [property: Url] string? ImageUrl,
    [property: MaxLength(20)] string? Status);

public sealed record ItemResponse(
    Guid Id,
    Guid UserId,
    string Name,
    string Category,
    string Color,
    IReadOnlyCollection<string> StyleTags,
    string ImageUrl,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
