using System.ComponentModel.DataAnnotations;

namespace OotdPlatform.Api.Contracts;

public sealed record CreateItemRequest(
    [Required, MaxLength(120)] string Name,
    [Required, MaxLength(30)] string Category,
    [Required, MaxLength(30)] string Color,
    IReadOnlyCollection<string>? StyleTags,
    [Url] string? ImageUrl);

public sealed record UpdateItemRequest(
    [MaxLength(120)] string? Name,
    [MaxLength(30)] string? Category,
    [MaxLength(30)] string? Color,
    IReadOnlyCollection<string>? StyleTags,
    [Url] string? ImageUrl,
    [MaxLength(20)] string? Status);

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
