using System.ComponentModel.DataAnnotations;

namespace OotdPlatform.Api.Contracts;

public sealed record UserProfileResponse(
    Guid Id,
    string Email,
    string DisplayName,
    string Role,
    string Status,
    IReadOnlyCollection<string> StylePreferences,
    string Locale);

public sealed record UpdateMeRequest(
    [MaxLength(100)] string? DisplayName,
    IReadOnlyCollection<string>? StylePreferences,
    [MaxLength(20)] string? Locale);
