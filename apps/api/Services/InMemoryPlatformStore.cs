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

    /// <summary>
    /// 上傳穿搭後由 AI 分析結果建立草稿 Outfit + 草稿 WardrobeItems。
    /// </summary>
    public (PlatformOutfit Outfit, IReadOnlyCollection<PlatformItem> DraftItems) CreateDraftOutfit(
        Guid userId,
        string imageUrl,
        DetectedOutfit detected)
    {
        var now = DateTimeOffset.UtcNow;
        var outfit = new Outfit
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = detected.Title.Trim(),
            Description = detected.Description?.Trim(),
            Occasion = detected.Occasion.Trim().ToLowerInvariant(),
            Season = detected.Season.Trim().ToLowerInvariant(),
            WeatherRange = null,
            ImageUrls = [imageUrl],
            ModerationStatus = "draft",
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Outfits.Add(outfit);

        var draftItems = new List<WardrobeItem>();
        foreach (var di in detected.Items)
        {
            var item = new WardrobeItem
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = di.Name.Trim(),
                Category = di.Category.Trim().ToLowerInvariant(),
                Color = di.Color.Trim().ToLowerInvariant(),
                StyleTags = di.StyleHints ?? [],
                ImageUrl = string.Empty,
                Status = "draft",
                CreatedAt = now,
                UpdatedAt = now
            };
            _dbContext.Items.Add(item);
            draftItems.Add(item);

            _dbContext.OutfitItems.Add(new OutfitItem
            {
                Id = Guid.NewGuid(),
                OutfitId = outfit.Id,
                ItemId = item.Id,
                CreatedAt = now
            });
        }

        _dbContext.SaveChanges();

        var platformOutfit = GetOutfit(outfit.Id)!;
        var platformItems = draftItems.Select(ToPlatformItem).ToArray();
        return (platformOutfit, platformItems);
    }

    /// <summary>
    /// 使用者確認草稿穿搭：更新 Outfit 欄位、整合單品（更新/新增/刪除），轉為 pending 狀態。
    /// </summary>
    public PlatformOutfit ConfirmDraftOutfit(
        Guid outfitId,
        Guid userId,
        string title,
        string? description,
        string occasion,
        string season,
        string? weatherRange,
        IReadOnlyCollection<(Guid? Id, string Name, string Category, string Color, IReadOnlyCollection<string>? StyleHints)> items)
    {
        var outfit = _dbContext.Outfits
            .Include(x => x.OutfitItems)
            .FirstOrDefault(x => x.Id == outfitId)
            ?? throw new KeyNotFoundException("OUTFIT_NOT_FOUND");

        if (outfit.UserId != userId)
            throw new UnauthorizedAccessException("FORBIDDEN");

        if (outfit.ModerationStatus != "draft")
            throw new InvalidOperationException("OUTFIT_NOT_DRAFT");

        outfit.Title = title.Trim();
        outfit.Description = description?.Trim();
        outfit.Occasion = occasion.Trim().ToLowerInvariant();
        outfit.Season = season.Trim().ToLowerInvariant();
        outfit.WeatherRange = weatherRange?.Trim();
        outfit.ModerationStatus = "pending";
        outfit.UpdatedAt = DateTimeOffset.UtcNow;

        // Collect existing draft item IDs linked to this outfit
        var existingItemIds = outfit.OutfitItems.Select(x => x.ItemId).ToHashSet();
        var confirmedItemIds = items.Where(x => x.Id.HasValue).Select(x => x.Id!.Value).ToHashSet();

        // Remove draft items that user deleted
        var toRemoveItemIds = existingItemIds.Except(confirmedItemIds).ToArray();
        foreach (var rid in toRemoveItemIds)
        {
            var item = _dbContext.Items.FirstOrDefault(x => x.Id == rid && x.UserId == userId);
            if (item is not null && item.Status == "draft")
                _dbContext.Items.Remove(item);
        }

        // Remove OutfitItems for deleted items
        var toRemoveLinks = outfit.OutfitItems.Where(x => toRemoveItemIds.Contains(x.ItemId)).ToArray();
        _dbContext.OutfitItems.RemoveRange(toRemoveLinks);

        var now = DateTimeOffset.UtcNow;

        foreach (var ci in items)
        {
            if (ci.Id.HasValue)
            {
                // Update existing draft item
                var existing = _dbContext.Items.FirstOrDefault(x => x.Id == ci.Id.Value && x.UserId == userId);
                if (existing is not null)
                {
                    existing.Name = ci.Name.Trim();
                    existing.Category = ci.Category.Trim().ToLowerInvariant();
                    existing.Color = ci.Color.Trim().ToLowerInvariant();
                    existing.StyleTags = ci.StyleHints?.ToArray() ?? [];
                    existing.Status = "active";
                    existing.UpdatedAt = now;
                }
            }
            else
            {
                // Create new item
                var newItem = new WardrobeItem
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Name = ci.Name.Trim(),
                    Category = ci.Category.Trim().ToLowerInvariant(),
                    Color = ci.Color.Trim().ToLowerInvariant(),
                    StyleTags = ci.StyleHints?.ToArray() ?? [],
                    ImageUrl = string.Empty,
                    Status = "active",
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _dbContext.Items.Add(newItem);
                _dbContext.OutfitItems.Add(new OutfitItem
                {
                    Id = Guid.NewGuid(),
                    OutfitId = outfitId,
                    ItemId = newItem.Id,
                    CreatedAt = now
                });
            }
        }

        _dbContext.SaveChanges();
        return GetOutfit(outfitId)!;
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
        var now = DateTimeOffset.UtcNow;
        
        // Seed Users if empty
        if (!_dbContext.Users.Any())
        {
            // Seed Admin User
            var adminId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            _dbContext.Users.Add(new User
            {
                Id = adminId,
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

            // Seed Test User (jyunyu@example.com / ghjk1591)
            _dbContext.Users.Add(new User
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                Email = "jyunyu@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("ghjk1591"),
                DisplayName = "Jun Yu",
                Role = "user",
                Status = "active",
                StylePreferences = ["casual", "streetwear", "minimal"],
                Locale = "zh-TW",
                CreatedAt = now,
                UpdatedAt = now
            });

            _dbContext.SaveChanges();
        }

        // Seed Sample Outfits if empty
        if (_dbContext.Outfits.Any())
        {
            return; // Outfits already seeded
        }

        // Get test user ID (either seeded or existing)
        var testUser = _dbContext.Users.FirstOrDefault(u => u.Email == "jyunyu@example.com");
        if (testUser == null)
        {
            return; // No test user found
        }

        var testUserId = testUser.Id;

        // Seed Sample Outfits (using Unsplash photos)
        var sampleOutfits = new[]
        {
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "都市休閒穿搭",
                Description = "適合日常通勤的舒適簡約風格",
                Occasion = "casual",
                Season = "spring",
                WeatherRange = "18-24",
                ImageUrls = ["https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddDays(-10),
                UpdatedAt = now.AddDays(-10)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "街頭潮流造型",
                Description = "Oversize 上衣搭配寬褲的街頭風",
                Occasion = "casual",
                Season = "autumn",
                WeatherRange = "15-22",
                ImageUrls = ["https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddDays(-9),
                UpdatedAt = now.AddDays(-9)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "優雅約會裝扮",
                Description = "溫柔風格的約會穿搭提案",
                Occasion = "date",
                Season = "spring",
                WeatherRange = "20-26",
                ImageUrls = ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddDays(-8),
                UpdatedAt = now.AddDays(-8)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "極簡黑白配色",
                Description = "經典黑白配色的簡約穿搭",
                Occasion = "casual",
                Season = "all",
                WeatherRange = "15-28",
                ImageUrls = ["https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddDays(-7),
                UpdatedAt = now.AddDays(-7)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "職場正式穿搭",
                Description = "專業又時尚的辦公室穿搭",
                Occasion = "work",
                Season = "spring",
                WeatherRange = "18-25",
                ImageUrls = ["https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddDays(-6),
                UpdatedAt = now.AddDays(-6)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "夏日清新風格",
                Description = "輕盈舒適的夏日穿搭",
                Occasion = "casual",
                Season = "summer",
                WeatherRange = "25-32",
                ImageUrls = ["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddDays(-5),
                UpdatedAt = now.AddDays(-5)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "運動休閒混搭",
                Description = "Athleisure 風格的日常穿搭",
                Occasion = "casual",
                Season = "spring",
                WeatherRange = "16-24",
                ImageUrls = ["https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddDays(-4),
                UpdatedAt = now.AddDays(-4)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "秋冬層次穿搭",
                Description = "多層次搭配的秋冬造型",
                Occasion = "casual",
                Season = "winter",
                WeatherRange = "5-15",
                ImageUrls = ["https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddDays(-3),
                UpdatedAt = now.AddDays(-3)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "復古文藝風",
                Description = "帶有復古感的文藝穿搭",
                Occasion = "casual",
                Season = "autumn",
                WeatherRange = "12-20",
                ImageUrls = ["https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddDays(-2),
                UpdatedAt = now.AddDays(-2)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "派對時尚裝扮",
                Description = "亮眼的派對穿搭造型",
                Occasion = "party",
                Season = "all",
                WeatherRange = "18-28",
                ImageUrls = ["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddDays(-1),
                UpdatedAt = now.AddDays(-1)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "丹寧經典搭配",
                Description = "永不退流行的丹寧穿搭",
                Occasion = "casual",
                Season = "all",
                WeatherRange = "15-26",
                ImageUrls = ["https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddHours(-18),
                UpdatedAt = now.AddHours(-18)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "韓系簡約風格",
                Description = "簡約俐落的韓系穿搭",
                Occasion = "casual",
                Season = "spring",
                WeatherRange = "18-25",
                ImageUrls = ["https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddHours(-12),
                UpdatedAt = now.AddHours(-12)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "工裝機能風",
                Description = "實用又帥氣的工裝穿搭",
                Occasion = "casual",
                Season = "autumn",
                WeatherRange = "12-22",
                ImageUrls = ["https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddHours(-6),
                UpdatedAt = now.AddHours(-6)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "波西米亞風情",
                Description = "自由隨性的波西米亞風格",
                Occasion = "casual",
                Season = "summer",
                WeatherRange = "22-30",
                ImageUrls = ["https://images.unsplash.com/photo-1467632499275-7a693a761056?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddHours(-3),
                UpdatedAt = now.AddHours(-3)
            },
            new Outfit
            {
                Id = Guid.NewGuid(),
                UserId = testUserId,
                Title = "摩登都會風",
                Description = "現代都會感的時尚穿搭",
                Occasion = "work",
                Season = "spring",
                WeatherRange = "18-26",
                ImageUrls = ["https://images.unsplash.com/photo-1550600000-00d26f7bc558?w=600&h=750&fit=crop&q=80"],
                ModerationStatus = "approved",
                CreatedAt = now.AddHours(-1),
                UpdatedAt = now.AddHours(-1)
            }
        };

        _dbContext.Outfits.AddRange(sampleOutfits);
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
