using Microsoft.EntityFrameworkCore;
using OotdPlatform.Api.Data;
using OotdPlatform.Api.Models;

namespace OotdPlatform.Api.Services;

public sealed class InMemoryPlatformStore
{
    private readonly AppDbContext _dbContext;

    public InMemoryPlatformStore(AppDbContext dbContext)
    {
        _dbContext = dbContext;
        EnsureSeedData();
    }

    public PlatformUser? GetUserByEmail(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = _dbContext.Users.AsNoTracking().FirstOrDefault(x => x.Email == normalizedEmail);
        return user is null ? null : ToPlatformUser(user);
    }

    public PlatformUser? GetUserById(Guid userId)
    {
        var user = _dbContext.Users.AsNoTracking().FirstOrDefault(x => x.Id == userId);
        return user is null ? null : ToPlatformUser(user);
    }

    public PlatformUser? ValidateUserCredentials(string email, string password)
    {
        var user = _dbContext.Users.AsNoTracking().FirstOrDefault(x => x.Email == email.Trim().ToLowerInvariant());
        if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            return null;
        }

        return ToPlatformUser(user);
    }

    public PlatformUser CreateUser(string email, string password, string displayName)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (_dbContext.Users.Any(x => x.Email == normalizedEmail))
        {
            throw new InvalidOperationException("EMAIL_ALREADY_EXISTS");
        }

        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            DisplayName = displayName.Trim(),
            Role = "user",
            Status = "active",
            StylePreferences = [],
            Locale = "zh-TW",
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Users.Add(user);
        _dbContext.SaveChanges();
        return ToPlatformUser(user);
    }

    public PlatformUser UpdateUser(Guid userId, string? displayName, IReadOnlyCollection<string>? stylePreferences, string? locale)
    {
        var user = _dbContext.Users.FirstOrDefault(x => x.Id == userId) ?? throw new KeyNotFoundException("USER_NOT_FOUND");

        if (!string.IsNullOrWhiteSpace(displayName))
        {
            user.DisplayName = displayName.Trim();
        }

        if (stylePreferences is not null)
        {
            user.StylePreferences = stylePreferences.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToArray();
        }

        if (!string.IsNullOrWhiteSpace(locale))
        {
            user.Locale = locale.Trim();
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        _dbContext.SaveChanges();
        return ToPlatformUser(user);
    }

    public IReadOnlyCollection<PlatformItem> GetItems(Guid userId, string? category, string? color)
    {
        var query = _dbContext.Items.AsNoTracking().Where(x => x.UserId == userId);
        if (!string.IsNullOrWhiteSpace(category))
        {
            var normalized = category.Trim().ToLowerInvariant();
            query = query.Where(x => x.Category == normalized);
        }

        if (!string.IsNullOrWhiteSpace(color))
        {
            var normalized = color.Trim().ToLowerInvariant();
            query = query.Where(x => x.Color == normalized);
        }

        return query.OrderByDescending(x => x.CreatedAt).Select(ToPlatformItem).ToArray();
    }

    public PlatformItem? GetItem(Guid itemId)
    {
        var item = _dbContext.Items.AsNoTracking().FirstOrDefault(x => x.Id == itemId);
        return item is null ? null : ToPlatformItem(item);
    }

    public IReadOnlyCollection<PlatformItem> GetItemsByIds(IReadOnlyCollection<Guid> ids)
    {
        if (ids.Count == 0) return [];
        return _dbContext.Items.AsNoTracking()
            .Where(x => ids.Contains(x.Id))
            .Select(ToPlatformItem)
            .ToArray();
    }

    public PlatformItem CreateItem(Guid userId, string name, string category, string color, IReadOnlyCollection<string>? styleTags, string? imageUrl)
    {
        var now = DateTimeOffset.UtcNow;
        var item = new WardrobeItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = name.Trim(),
            Category = category.Trim().ToLowerInvariant(),
            Color = color.Trim().ToLowerInvariant(),
            StyleTags = styleTags?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToArray() ?? [],
            ImageUrl = imageUrl?.Trim() ?? string.Empty,
            Status = "active",
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Items.Add(item);
        _dbContext.SaveChanges();
        return ToPlatformItem(item);
    }

    public PlatformItem UpdateItem(Guid itemId, Guid userId, string? name, string? category, string? color, IReadOnlyCollection<string>? styleTags, string? imageUrl, string? status)
    {
        var item = _dbContext.Items.FirstOrDefault(x => x.Id == itemId) ?? throw new KeyNotFoundException("ITEM_NOT_FOUND");
        if (item.UserId != userId)
        {
            throw new UnauthorizedAccessException("FORBIDDEN");
        }

        if (!string.IsNullOrWhiteSpace(name))
        {
            item.Name = name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            item.Category = category.Trim().ToLowerInvariant();
        }

        if (!string.IsNullOrWhiteSpace(color))
        {
            item.Color = color.Trim().ToLowerInvariant();
        }

        if (styleTags is not null)
        {
            item.StyleTags = styleTags.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToArray();
        }

        if (!string.IsNullOrWhiteSpace(imageUrl))
        {
            item.ImageUrl = imageUrl.Trim();
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            item.Status = status.Trim().ToLowerInvariant();
        }

        item.UpdatedAt = DateTimeOffset.UtcNow;
        _dbContext.SaveChanges();
        return ToPlatformItem(item);
    }

    /// <summary>
    /// 由 Gemini 背景分析完成後呼叫，僅更新 StyleTags。
    /// 此方法使用新的 DbContext 範疇，不依賴已關閉的請求範疇。
    /// </summary>
    public void UpdateItemStyleTagsBackground(Guid itemId, IReadOnlyCollection<string> styleTags)
    {
        var item = _dbContext.Items.FirstOrDefault(x => x.Id == itemId);
        if (item is null) return;

        item.StyleTags = styleTags.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToArray();
        item.UpdatedAt = DateTimeOffset.UtcNow;
        _dbContext.SaveChanges();
    }

    public bool ArchiveItem(Guid itemId, Guid userId)
    {
        var item = _dbContext.Items.FirstOrDefault(x => x.Id == itemId);
        if (item is null || item.UserId != userId)
        {
            return false;
        }

        item.Status = "archived";
        item.UpdatedAt = DateTimeOffset.UtcNow;
        _dbContext.SaveChanges();
        return true;
    }

    public IReadOnlyCollection<PlatformOutfit> GetOutfitsByUser(Guid userId)
    {
        return _dbContext.Outfits
            .AsNoTracking()
            .Include(x => x.OutfitItems)
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(ToPlatformOutfit)
            .ToArray();
    }

    public IReadOnlyCollection<PlatformOutfit> GetOutfitsByStatus(string status)
    {
        var normalized = status.Trim().ToLowerInvariant();
        return _dbContext.Outfits
            .AsNoTracking()
            .Include(x => x.OutfitItems)
            .Where(x => x.ModerationStatus == normalized)
            .OrderByDescending(x => x.CreatedAt)
            .Select(ToPlatformOutfit)
            .ToArray();
    }

    public PlatformOutfit? GetOutfit(Guid id)
    {
        var outfit = _dbContext.Outfits
            .AsNoTracking()
            .Include(x => x.OutfitItems)
            .FirstOrDefault(x => x.Id == id);

        return outfit is null ? null : ToPlatformOutfit(outfit);
    }

    public PlatformOutfit CreateOutfit(Guid userId, string title, string? description, string occasion, string season, string? weatherRange, IReadOnlyCollection<string>? imageUrls, IReadOnlyCollection<Guid>? itemIds)
    {
        var now = DateTimeOffset.UtcNow;
        var outfit = new Outfit
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title.Trim(),
            Description = description?.Trim(),
            Occasion = occasion.Trim().ToLowerInvariant(),
            Season = season.Trim().ToLowerInvariant(),
            WeatherRange = weatherRange?.Trim(),
            ImageUrls = imageUrls?.ToArray() ?? [],
            ModerationStatus = "pending",
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Outfits.Add(outfit);

        var distinctItemIds = itemIds?.Distinct().ToArray() ?? [];
        foreach (var itemId in distinctItemIds)
        {
            _dbContext.OutfitItems.Add(new OutfitItem
            {
                Id = Guid.NewGuid(),
                OutfitId = outfit.Id,
                ItemId = itemId,
                CreatedAt = now
            });
        }

        _dbContext.SaveChanges();
        return GetOutfit(outfit.Id)!;
    }

    public PlatformOutfit UpdateOutfit(Guid outfitId, Guid userId, string? title, string? description, string? occasion, string? season, string? weatherRange, IReadOnlyCollection<string>? imageUrls, IReadOnlyCollection<Guid>? itemIds)
    {
        var outfit = _dbContext.Outfits.Include(x => x.OutfitItems).FirstOrDefault(x => x.Id == outfitId) ?? throw new KeyNotFoundException("OUTFIT_NOT_FOUND");
        if (outfit.UserId != userId)
        {
            throw new UnauthorizedAccessException("FORBIDDEN");
        }

        if (!string.IsNullOrWhiteSpace(title))
        {
            outfit.Title = title.Trim();
        }

        if (description is not null)
        {
            outfit.Description = description.Trim();
        }

        if (!string.IsNullOrWhiteSpace(occasion))
        {
            outfit.Occasion = occasion.Trim().ToLowerInvariant();
        }

        if (!string.IsNullOrWhiteSpace(season))
        {
            outfit.Season = season.Trim().ToLowerInvariant();
        }

        if (weatherRange is not null)
        {
            outfit.WeatherRange = weatherRange.Trim();
        }

        if (imageUrls is not null)
        {
            outfit.ImageUrls = imageUrls.ToArray();
        }

        if (itemIds is not null)
        {
            _dbContext.OutfitItems.RemoveRange(outfit.OutfitItems);
            foreach (var itemId in itemIds.Distinct())
            {
                _dbContext.OutfitItems.Add(new OutfitItem
                {
                    Id = Guid.NewGuid(),
                    OutfitId = outfit.Id,
                    ItemId = itemId,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }
        }

        outfit.ModerationStatus = "pending";
        outfit.UpdatedAt = DateTimeOffset.UtcNow;
        _dbContext.SaveChanges();
        return GetOutfit(outfit.Id)!;
    }

    public bool DeleteOutfit(Guid outfitId, Guid userId)
    {
        var outfit = _dbContext.Outfits.Include(x => x.OutfitItems).FirstOrDefault(x => x.Id == outfitId);
        if (outfit is null || outfit.UserId != userId)
        {
            return false;
        }

        _dbContext.OutfitItems.RemoveRange(outfit.OutfitItems);
        _dbContext.Outfits.Remove(outfit);
        _dbContext.SaveChanges();
        return true;
    }

    public PlatformRecommendationLog CreateRecommendationLog(Guid userId, IReadOnlyCollection<Guid> itemIds, string occasion, string season, string weather, IReadOnlyCollection<string>? styleHints, int latencyMs, IReadOnlyCollection<Guid> resultOutfitIds)
    {
        var log = new RecommendationLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            InputItemIds = itemIds.ToArray(),
            Occasion = occasion,
            Season = season,
            Weather = weather,
            StyleHints = styleHints?.ToArray() ?? [],
            ResultOutfitIds = resultOutfitIds.ToArray(),
            LatencyMs = latencyMs,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.RecommendationLogs.Add(log);
        _dbContext.SaveChanges();
        return ToPlatformRecommendationLog(log);
    }

    public PlatformRecommendationLog? GetRecommendationLog(Guid id)
    {
        var log = _dbContext.RecommendationLogs.AsNoTracking().FirstOrDefault(x => x.Id == id);
        return log is null ? null : ToPlatformRecommendationLog(log);
    }

    public PlatformFeedback CreateFeedback(Guid userId, Guid recommendationId, bool helpful, string? reason)
    {
        var exists = _dbContext.RecommendationLogs.Any(x => x.Id == recommendationId);
        if (!exists)
        {
            throw new KeyNotFoundException("RECOMMENDATION_NOT_FOUND");
        }

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RecommendationId = recommendationId,
            Helpful = helpful,
            Reason = reason?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Feedbacks.Add(feedback);
        _dbContext.SaveChanges();
        return new PlatformFeedback(feedback.Id, feedback.UserId, feedback.RecommendationId, feedback.Helpful, feedback.Reason, feedback.CreatedAt);
    }

    public PlatformOutfit ModerateOutfit(Guid outfitId, Guid operatorUserId, string action, string? note)
    {
        var outfit = _dbContext.Outfits.Include(x => x.OutfitItems).FirstOrDefault(x => x.Id == outfitId) ?? throw new KeyNotFoundException("OUTFIT_NOT_FOUND");
        outfit.ModerationStatus = action.Equals("approve", StringComparison.OrdinalIgnoreCase) ? "approved" : "rejected";
        outfit.UpdatedAt = DateTimeOffset.UtcNow;

        _dbContext.ModerationActions.Add(new ModerationAction
        {
            Id = Guid.NewGuid(),
            TargetType = "outfit",
            TargetId = outfitId,
            Action = action.Equals("approve", StringComparison.OrdinalIgnoreCase) ? "approve" : "reject",
            OperatorUserId = operatorUserId,
            Note = note,
            CreatedAt = DateTimeOffset.UtcNow
        });

        _dbContext.SaveChanges();
        return ToPlatformOutfit(outfit);
    }

    public IReadOnlyCollection<PlatformUser> GetUsers(int page, int pageSize)
        => _dbContext.Users.AsNoTracking()
            .OrderBy(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToPlatformUser)
            .ToArray();

    public int GetUsersTotal() => _dbContext.Users.Count();

    public PlatformUser UpdateUserStatus(Guid userId, string status, Guid operatorUserId)
    {
        var user = _dbContext.Users.FirstOrDefault(x => x.Id == userId) ?? throw new KeyNotFoundException("USER_NOT_FOUND");
        user.Status = status;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        _dbContext.ModerationActions.Add(new ModerationAction
        {
            Id = Guid.NewGuid(),
            TargetType = "user",
            TargetId = userId,
            Action = status == "banned" ? "ban" : "unban",
            OperatorUserId = operatorUserId,
            CreatedAt = DateTimeOffset.UtcNow
        });

        _dbContext.SaveChanges();
        return ToPlatformUser(user);
    }

    private void EnsureSeedData()
    {
        if (_dbContext.Users.Any())
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        _dbContext.Users.Add(new User
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Email = "admin@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            DisplayName = "Admin",
            Role = "admin",
            Status = "active",
            StylePreferences = [],
            Locale = "zh-TW",
            CreatedAt = now,
            UpdatedAt = now
        });

        _dbContext.SaveChanges();
    }

    private static PlatformUser ToPlatformUser(User user)
        => new(user.Id, user.Email, user.PasswordHash, user.DisplayName, user.Role, user.Status, user.StylePreferences, user.Locale, user.CreatedAt, user.UpdatedAt);

    private static PlatformItem ToPlatformItem(WardrobeItem item)
        => new(item.Id, item.UserId, item.Name, item.Category, item.Color, item.StyleTags, item.ImageUrl, item.Status, item.CreatedAt, item.UpdatedAt);

    private static PlatformOutfit ToPlatformOutfit(Outfit outfit)
        => new(
            outfit.Id,
            outfit.UserId,
            outfit.Title,
            outfit.Description,
            outfit.Occasion,
            outfit.Season,
            outfit.WeatherRange,
            outfit.ImageUrls,
            outfit.OutfitItems.Select(x => x.ItemId).ToArray(),
            outfit.ModerationStatus,
            outfit.CreatedAt,
            outfit.UpdatedAt);

    private static PlatformRecommendationLog ToPlatformRecommendationLog(RecommendationLog log)
        => new(
            log.Id,
            log.UserId,
            log.InputItemIds,
            new PlatformRecommendationContext(log.Occasion, log.Season, log.Weather, log.StyleHints),
            log.ResultOutfitIds,
            log.LatencyMs,
            log.CreatedAt);
}

public sealed record PlatformUser(
    Guid Id,
    string Email,
    string PasswordHash,
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
