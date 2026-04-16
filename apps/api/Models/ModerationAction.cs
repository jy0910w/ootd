namespace OotdPlatform.Api.Models;

public sealed class ModerationAction
{
    public Guid Id { get; set; }
    public string TargetType { get; set; } = string.Empty;
    public Guid TargetId { get; set; }
    public string Action { get; set; } = string.Empty;
    public Guid OperatorUserId { get; set; }
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public User OperatorUser { get; set; } = null!;
}
