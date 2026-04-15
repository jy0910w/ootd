namespace OotdPlatform.Api.Contracts;

public sealed record ApiErrorResponse(
    string Code,
    string Message,
    IReadOnlyCollection<ErrorDetail>? Details,
    string TraceId);

public sealed record ErrorDetail(string Field, string Reason);
