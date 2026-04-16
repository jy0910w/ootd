namespace OotdPlatform.Api.Models;

public sealed class Feedback
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid RecommendationId { get; set; }
    public bool Helpful { get; set; }
    public string? Reason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public User User { get; set; } = null!;
    public RecommendationLog Recommendation { get; set; } = null!;
}
