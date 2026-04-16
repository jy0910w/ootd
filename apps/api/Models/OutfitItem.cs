namespace OotdPlatform.Api.Models;

public sealed class OutfitItem
{
    public Guid Id { get; set; }
    public Guid OutfitId { get; set; }
    public Guid ItemId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Outfit Outfit { get; set; } = null!;
    public WardrobeItem Item { get; set; } = null!;
}
