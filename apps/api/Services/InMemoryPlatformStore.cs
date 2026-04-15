using System.Collections.Concurrent;

namespace OotdPlatform.Api.Services;

public sealed class InMemoryPlatformStore
{
    private readonly ConcurrentDictionary<Guid, PlatformUser> _users = new();
    private readonly ConcurrentDictionary<string, Guid> _emailToUserId = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<Guid, PlatformItem> _items = new();
    private readonly ConcurrentDictionary<Guid, PlatformOutfit> _outfits = new();
    private readonly ConcurrentDictionary<Guid, PlatformRecommendationLog> _recommendationLogs = new();
    private readonly ConcurrentDictionary<Guid, PlatformFeedback> _feedback = new();
    private readonly ConcurrentBag<PlatformModerationAction> _moderationActions = [];

    public InMemoryPlatformStore()
    {
        var admin = new PlatformUser(
            Guid.Parse("00000000-0000-0000-0000-000000000001"),
            "admin@example.com",
            "Admin123!",
            "Admin",
            "admin",
            "active",
            [],
            "zh-TW",
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow);

        _users[admin.Id] = admin;
        _emailToUserId[admin.Email] = admin.Id;
    }

    public PlatformUser? GetUserByEmail(string email)
        => _emailToUserId.TryGetValue(email, out var id) && _users.TryGetValue(id, out var user) ? user : null;

    public PlatformUser? GetUserById(Guid userId)
        => _users.TryGetValue(userId, out var user) ? user : null;

    public PlatformUser CreateUser(string email, string password, string displayName)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (_emailToUserId.ContainsKey(normalizedEmail))
        {
            throw new InvalidOperationException("EMAIL_ALREADY_EXISTS");
        }

        var now = DateTimeOffset.UtcNow;
        var user = new PlatformUser(Guid.NewGuid(), normalizedEmail, password, displayName.Trim(), "user", "active", [], "zh-TW", now, now);

        if (!_emailToUserId.TryAdd(normalizedEmail, user.Id) || !_users.TryAdd(user.Id, user))
        {
            throw new InvalidOperationException("USER_CREATE_FAILED");
        }

        return user;
    }

    public PlatformUser UpdateUser(Guid userId, string? displayName, IReadOnlyCollection<string>? stylePreferences, string? locale)
    {
        var existing = GetUserById(userId) ?? throw new KeyNotFoundException("USER_NOT_FOUND");
        var updated = existing with
        {
            DisplayName = string.IsNullOrWhiteSpace(displayName) ? existing.DisplayName : displayName.Trim(),
            StylePreferences = stylePreferences?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToArray() ?? existing.StylePreferences,
            Locale = string.IsNullOrWhiteSpace(locale) ? existing.Locale : locale.Trim(),
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _users[userId] = updated;
        return updated;
    }

    public IReadOnlyCollection<PlatformItem> GetItems(Guid userId, string? category, string? color)
    {
        var query = _items.Values.Where(x => x.UserId == userId);
        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(x => x.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(color))
        {
            query = query.Where(x => x.Color.Equals(color, StringComparison.OrdinalIgnoreCase));
        }

        return query.OrderByDescending(x => x.CreatedAt).ToArray();
    }

    public PlatformItem? GetItem(Guid itemId) => _items.TryGetValue(itemId, out var item) ? item : null;

    public PlatformItem CreateItem(Guid userId, string name, string category, string color, IReadOnlyCollection<string>? styleTags, string imageUrl)
    {
        var now = DateTimeOffset.UtcNow;
        var item = new PlatformItem(Guid.NewGuid(), userId, name.Trim(), category.Trim().ToLowerInvariant(), color.Trim().ToLowerInvariant(),
            styleTags?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToArray() ?? [], imageUrl.Trim(), "active", now, now);

        _items[item.Id] = item;
        return item;
    }

    public PlatformItem UpdateItem(Guid itemId, Guid userId, string? name, string? category, string? color, IReadOnlyCollection<string>? styleTags, string? imageUrl, string? status)
    {
        var existing = GetItem(itemId) ?? throw new KeyNotFoundException("ITEM_NOT_FOUND");
        if (existing.UserId != userId)
        {
            throw new UnauthorizedAccessException("FORBIDDEN");
        }

        var updated = existing with
        {
            Name = string.IsNullOrWhiteSpace(name) ? existing.Name : name.Trim(),
            Category = string.IsNullOrWhiteSpace(category) ? existing.Category : category.Trim().ToLowerInvariant(),
            Color = string.IsNullOrWhiteSpace(color) ? existing.Color : color.Trim().ToLowerInvariant(),
            StyleTags = styleTags?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToArray() ?? existing.StyleTags,
            ImageUrl = string.IsNullOrWhiteSpace(imageUrl) ? existing.ImageUrl : imageUrl.Trim(),
            Status = string.IsNullOrWhiteSpace(status) ? existing.Status : status.Trim().ToLowerInvariant(),
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _items[itemId] = updated;
        return updated;
    }

    public bool ArchiveItem(Guid itemId, Guid userId)
    {
        var existing = GetItem(itemId);
        if (existing is null || existing.UserId != userId)
        {
            return false;
        }

        _items[itemId] = existing with { Status = "archived", UpdatedAt = DateTimeOffset.UtcNow };
        return true;
    }

    public IReadOnlyCollection<PlatformOutfit> GetOutfitsByUser(Guid userId)
        => _outfits.Values.Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt).ToArray();

    public IReadOnlyCollection<PlatformOutfit> GetOutfitsByStatus(string status)
        => _outfits.Values.Where(x => x.ModerationStatus.Equals(status, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(x => x.CreatedAt).ToArray();

    public PlatformOutfit? GetOutfit(Guid id) => _outfits.TryGetValue(id, out var outfit) ? outfit : null;

    public PlatformOutfit CreateOutfit(Guid userId, string title, string? description, string occasion, string season, string? weatherRange, IReadOnlyCollection<string> imageUrls, IReadOnlyCollection<Guid>? itemIds)
    {
        var now = DateTimeOffset.UtcNow;
        var outfit = new PlatformOutfit(
            Guid.NewGuid(),
            userId,
            title.Trim(),
            description?.Trim(),
            occasion.Trim().ToLowerInvariant(),
            season.Trim().ToLowerInvariant(),
            weatherRange?.Trim(),
            imageUrls.ToArray(),
            itemIds?.Distinct().ToArray() ?? [],
            "pending",
            now,
            now);

        _outfits[outfit.Id] = outfit;
        return outfit;
    }

    public PlatformOutfit UpdateOutfit(Guid outfitId, Guid userId, string? title, string? description, string? occasion, string? season, string? weatherRange, IReadOnlyCollection<string>? imageUrls, IReadOnlyCollection<Guid>? itemIds)
    {
        var existing = GetOutfit(outfitId) ?? throw new KeyNotFoundException("OUTFIT_NOT_FOUND");
        if (existing.UserId != userId)
        {
            throw new UnauthorizedAccessException("FORBIDDEN");
        }

        var updated = existing with
        {
            Title = string.IsNullOrWhiteSpace(title) ? existing.Title : title.Trim(),
            Description = description?.Trim() ?? existing.Description,
            Occasion = string.IsNullOrWhiteSpace(occasion) ? existing.Occasion : occasion.Trim().ToLowerInvariant(),
            Season = string.IsNullOrWhiteSpace(season) ? existing.Season : season.Trim().ToLowerInvariant(),
            WeatherRange = weatherRange?.Trim() ?? existing.WeatherRange,
            ImageUrls = imageUrls?.ToArray() ?? existing.ImageUrls,
            ItemIds = itemIds?.Distinct().ToArray() ?? existing.ItemIds,
            UpdatedAt = DateTimeOffset.UtcNow,
            ModerationStatus = "pending"
        };

        _outfits[outfitId] = updated;
        return updated;
    }

    public bool DeleteOutfit(Guid outfitId, Guid userId)
    {
        var existing = GetOutfit(outfitId);
        if (existing is null || existing.UserId != userId)
        {
            return false;
        }

        return _outfits.TryRemove(outfitId, out _);
    }

    public PlatformRecommendationLog CreateRecommendationLog(Guid userId, IReadOnlyCollection<Guid> itemIds, string occasion, string season, string weather, IReadOnlyCollection<string>? styleHints, int latencyMs, IReadOnlyCollection<Guid> resultOutfitIds)
    {
        var log = new PlatformRecommendationLog(
            Guid.NewGuid(),
            userId,
            itemIds.ToArray(),
            new PlatformRecommendationContext(occasion, season, weather, styleHints?.ToArray() ?? []),
            resultOutfitIds.ToArray(),
            latencyMs,
            DateTimeOffset.UtcNow);

        _recommendationLogs[log.Id] = log;
        return log;
    }

    public PlatformRecommendationLog? GetRecommendationLog(Guid id) => _recommendationLogs.TryGetValue(id, out var log) ? log : null;

    public PlatformFeedback CreateFeedback(Guid userId, Guid recommendationId, bool helpful, string? reason)
    {
        if (!_recommendationLogs.ContainsKey(recommendationId))
        {
            throw new KeyNotFoundException("RECOMMENDATION_NOT_FOUND");
        }

        var feedback = new PlatformFeedback(Guid.NewGuid(), userId, recommendationId, helpful, reason?.Trim(), DateTimeOffset.UtcNow);
        _feedback[feedback.Id] = feedback;
        return feedback;
    }

    public PlatformOutfit ModerateOutfit(Guid outfitId, Guid operatorUserId, string action, string? note)
    {
        var existing = GetOutfit(outfitId) ?? throw new KeyNotFoundException("OUTFIT_NOT_FOUND");
        var status = action.Equals("approve", StringComparison.OrdinalIgnoreCase) ? "approved" : "rejected";
        var updated = existing with { ModerationStatus = status, UpdatedAt = DateTimeOffset.UtcNow };
        _outfits[outfitId] = updated;
        _moderationActions.Add(new PlatformModerationAction(Guid.NewGuid(), "outfit", outfitId, action, operatorUserId, note, DateTimeOffset.UtcNow));
        return updated;
    }

    public IReadOnlyCollection<PlatformUser> GetUsers(int page, int pageSize)
    {
        return _users.Values
            .OrderBy(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToArray();
    }

    public int GetUsersTotal() => _users.Count;

    public PlatformUser UpdateUserStatus(Guid userId, string status, Guid operatorUserId)
    {
        var existing = GetUserById(userId) ?? throw new KeyNotFoundException("USER_NOT_FOUND");
        var updated = existing with { Status = status, UpdatedAt = DateTimeOffset.UtcNow };
        _users[userId] = updated;
        _moderationActions.Add(new PlatformModerationAction(
            Guid.NewGuid(),
            "user",
            userId,
            status == "banned" ? "ban" : "unban",
            operatorUserId,
            null,
            DateTimeOffset.UtcNow));
        return updated;
    }
}

public sealed record PlatformUser(
    Guid Id,
    string Email,
    string Password,
    string DisplayName,
    string Role,
    string Status,
    IReadOnlyCollection<string> StylePreferences,
    string Locale,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record PlatformItem(
    Guid Id,
    Guid UserId,
    string Name,
    string Category,
    string Color,
    IReadOnlyCollection<string> StyleTags,
    string ImageUrl,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record PlatformOutfit(
    Guid Id,
    Guid UserId,
    string Title,
    string? Description,
    string Occasion,
    string Season,
    string? WeatherRange,
    IReadOnlyCollection<string> ImageUrls,
    IReadOnlyCollection<Guid> ItemIds,
    string ModerationStatus,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record PlatformRecommendationContext(string Occasion, string Season, string Weather, IReadOnlyCollection<string> StyleHints);

public sealed record PlatformRecommendationLog(
    Guid Id,
    Guid UserId,
    IReadOnlyCollection<Guid> InputItemIds,
    PlatformRecommendationContext Context,
    IReadOnlyCollection<Guid> ResultOutfitIds,
    int LatencyMs,
    DateTimeOffset CreatedAt);

public sealed record PlatformFeedback(
    Guid Id,
    Guid UserId,
    Guid RecommendationId,
    bool Helpful,
    string? Reason,
    DateTimeOffset CreatedAt);

public sealed record PlatformModerationAction(
    Guid Id,
    string TargetType,
    Guid TargetId,
    string Action,
    Guid OperatorUserId,
    string? Note,
    DateTimeOffset CreatedAt);
