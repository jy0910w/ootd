using System.ComponentModel.DataAnnotations;

namespace OotdPlatform.Api.Contracts;

public sealed record RegisterRequest(
    [property: Required, EmailAddress] string Email,
    [property: Required, MinLength(8)] string Password,
    [property: Required, MaxLength(100)] string DisplayName);

public sealed record LoginRequest(
    [property: Required, EmailAddress] string Email,
    [property: Required] string Password);

public sealed record RefreshTokenRequest([property: Required] string RefreshToken);

public sealed record LogoutRequest([property: Required] string RefreshToken);

public sealed record AuthResponse(UserProfileResponse User, string AccessToken, string RefreshToken);
