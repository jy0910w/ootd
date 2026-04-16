namespace OotdPlatform.Api.Models;

public sealed class Outfit
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Occasion { get; set; } = string.Empty;
    public string Season { get; set; } = string.Empty;
    public string? WeatherRange { get; set; }
    public string[] ImageUrls { get; set; } = [];
    public string ModerationStatus { get; set; } = "pending";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<OutfitItem> OutfitItems { get; set; } = [];
}
