using System.ComponentModel.DataAnnotations;

namespace OotdPlatform.Api.Contracts;

public sealed record CreateFeedbackRequest(
    [Required] Guid RecommendationId,
    bool Helpful,
    [MaxLength(500)] string? Reason);

public sealed record CreateFeedbackResponse(Guid Id, bool Success);
