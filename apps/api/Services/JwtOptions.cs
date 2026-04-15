namespace OotdPlatform.Api.Services;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = "ootd-platform";
    public string Audience { get; init; } = "ootd-clients";
    public string SigningKey { get; init; } = "dev-signing-key-change-me-1234567890123456";
    public int AccessTokenMinutes { get; init; } = 30;
    public int RefreshTokenDays { get; init; } = 7;

    public static JwtOptions FromConfiguration(IConfiguration configuration)
    {
        var options = configuration.GetSection(SectionName).Get<JwtOptions>() ?? new JwtOptions();

        var envSigningKey = configuration["JWT_SIGNING_KEY"];
        if (!string.IsNullOrWhiteSpace(envSigningKey))
        {
            options = new JwtOptions
            {
                Issuer = options.Issuer,
                Audience = options.Audience,
                SigningKey = envSigningKey,
                AccessTokenMinutes = options.AccessTokenMinutes,
                RefreshTokenDays = options.RefreshTokenDays
            };
        }

        return options;
    }
}
