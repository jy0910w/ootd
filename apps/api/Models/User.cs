namespace OotdPlatform.Api.Models;

public sealed class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = "user";
    public string Status { get; set; } = "active";
    public string[] StylePreferences { get; set; } = [];
    public string Locale { get; set; } = "zh-TW";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<WardrobeItem> Items { get; set; } = [];
    public ICollection<Outfit> Outfits { get; set; } = [];
    public ICollection<RecommendationLog> RecommendationLogs { get; set; } = [];
    public ICollection<Feedback> Feedbacks { get; set; } = [];
    public ICollection<ModerationAction> ModerationActions { get; set; } = [];
    public ICollection<UserRefreshToken> RefreshTokens { get; set; } = [];
}
