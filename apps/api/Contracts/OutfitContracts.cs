using System.ComponentModel.DataAnnotations;

namespace OotdPlatform.Api.Contracts;

public sealed record CreateOutfitRequest(
    [Required, MaxLength(140)] string Title,
    [MaxLength(2000)] string? Description,
    [Required, MaxLength(30)] string Occasion,
    [Required, MaxLength(20)] string Season,
    [MaxLength(30)] string? WeatherRange,
    IReadOnlyCollection<string>? ImageUrls,
    IReadOnlyCollection<Guid>? ItemIds);

public sealed record UpdateOutfitRequest(
    [MaxLength(140)] string? Title,
    [MaxLength(2000)] string? Description,
    [MaxLength(30)] string? Occasion,
    [MaxLength(20)] string? Season,
    [MaxLength(30)] string? WeatherRange,
    IReadOnlyCollection<string>? ImageUrls,
    IReadOnlyCollection<Guid>? ItemIds);

public sealed record OutfitResponse(
    Guid Id,
    Guid UserId,
    string Title,
    string? Description,
    string Occasion,
    string Season,
    string? WeatherRange,
    IReadOnlyCollection<string> ImageUrls,
    IReadOnlyCollection<Guid> ItemIds,
    string ModerationStatus,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateOutfitResponse(Guid Id, string ModerationStatus);
