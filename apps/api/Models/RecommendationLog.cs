namespace OotdPlatform.Api.Models;

public sealed class RecommendationLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid[] InputItemIds { get; set; } = [];
    public string Occasion { get; set; } = string.Empty;
    public string Season { get; set; } = string.Empty;
    public string Weather { get; set; } = string.Empty;
    public string[] StyleHints { get; set; } = [];
    public Guid[] ResultOutfitIds { get; set; } = [];
    public int LatencyMs { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public User User { get; set; } = null!;
}
