using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace OotdPlatform.Api.Services;

public sealed class JwtTokenService
{
    private readonly JwtOptions _options;
    private readonly ConcurrentDictionary<string, RefreshTokenRecord> _refreshTokens = new();

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public string GenerateAccessToken(PlatformUser user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_options.AccessTokenMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken(Guid userId)
    {
        var refreshToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        _refreshTokens[refreshToken] = new RefreshTokenRecord(userId, DateTimeOffset.UtcNow.AddDays(_options.RefreshTokenDays));
        return refreshToken;
    }

    public (bool Success, Guid UserId) ValidateRefreshToken(string refreshToken)
    {
        if (_refreshTokens.TryGetValue(refreshToken, out var record) && record.ExpiresAt > DateTimeOffset.UtcNow)
        {
            return (true, record.UserId);
        }

        return (false, Guid.Empty);
    }

    public void RevokeRefreshToken(string refreshToken)
    {
        _refreshTokens.TryRemove(refreshToken, out _);
    }

    public string RotateRefreshToken(string refreshToken)
    {
        var validation = ValidateRefreshToken(refreshToken);
        if (!validation.Success)
        {
            throw new SecurityTokenException("REFRESH_TOKEN_INVALID");
        }

        RevokeRefreshToken(refreshToken);
        return GenerateRefreshToken(validation.UserId);
    }

    private sealed record RefreshTokenRecord(Guid UserId, DateTimeOffset ExpiresAt);
}
