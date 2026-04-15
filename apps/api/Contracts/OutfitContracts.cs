using System.ComponentModel.DataAnnotations;

namespace OotdPlatform.Api.Contracts;

public sealed record CreateOutfitRequest(
    [property: Required, MaxLength(140)] string Title,
    [property: MaxLength(2000)] string? Description,
    [property: Required, MaxLength(30)] string Occasion,
    [property: Required, MaxLength(20)] string Season,
    [property: MaxLength(30)] string? WeatherRange,
    [property: Required, MinLength(1)] IReadOnlyCollection<string> ImageUrls,
    IReadOnlyCollection<Guid>? ItemIds);

public sealed record UpdateOutfitRequest(
    [property: MaxLength(140)] string? Title,
    [property: MaxLength(2000)] string? Description,
    [property: MaxLength(30)] string? Occasion,
    [property: MaxLength(20)] string? Season,
    [property: MaxLength(30)] string? WeatherRange,
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
