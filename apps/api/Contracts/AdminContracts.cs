using System.ComponentModel.DataAnnotations;

namespace OotdPlatform.Api.Contracts;

public sealed record RejectOutfitRequest([property: Required, MaxLength(500)] string Reason);

public sealed record AdminActionResponse(bool Success);

public sealed record AdminUserResponse(Guid Id, string Email, string DisplayName, string Role, string Status, DateTimeOffset CreatedAt);
