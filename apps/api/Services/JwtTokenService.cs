using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using OotdPlatform.Api.Data;
using OotdPlatform.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace OotdPlatform.Api.Services;

public sealed class JwtTokenService
{
    private readonly JwtOptions _options;
    private readonly AppDbContext _dbContext;

    public JwtTokenService(IOptions<JwtOptions> options, AppDbContext dbContext)
    {
        _options = options.Value;
        _dbContext = dbContext;
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
        var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var tokenHash = HashToken(raw);

        _dbContext.UserRefreshTokens.Add(new UserRefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_options.RefreshTokenDays),
            CreatedAt = DateTimeOffset.UtcNow
        });

        _dbContext.SaveChanges();
        return raw;
    }

    public (bool Success, Guid UserId) ValidateRefreshToken(string refreshToken)
    {
        var tokenHash = HashToken(refreshToken);
        var token = _dbContext.UserRefreshTokens
            .AsNoTracking()
            .FirstOrDefault(x => x.TokenHash == tokenHash);

        if (token is null || token.RevokedAt is not null || token.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return (false, Guid.Empty);
        }

        return (true, token.UserId);
    }

    public void RevokeRefreshToken(string refreshToken)
    {
        var tokenHash = HashToken(refreshToken);
        var token = _dbContext.UserRefreshTokens.FirstOrDefault(x => x.TokenHash == tokenHash);
        if (token is null)
        {
            return;
        }

        token.RevokedAt = DateTimeOffset.UtcNow;
        _dbContext.SaveChanges();
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

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
