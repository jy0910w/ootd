using System.ComponentModel.DataAnnotations;

namespace OotdPlatform.Api.Contracts;

public sealed record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required, MaxLength(100)] string DisplayName);

public sealed record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public sealed record RefreshTokenRequest([Required] string RefreshToken);

public sealed record LogoutRequest([Required] string RefreshToken);

public sealed record AuthResponse(UserProfileResponse User, string AccessToken, string RefreshToken);
