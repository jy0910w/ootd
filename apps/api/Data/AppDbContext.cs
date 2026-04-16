using Microsoft.EntityFrameworkCore;
using OotdPlatform.Api.Models;

namespace OotdPlatform.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<WardrobeItem> Items => Set<WardrobeItem>();
    public DbSet<Outfit> Outfits => Set<Outfit>();
    public DbSet<OutfitItem> OutfitItems => Set<OutfitItem>();
    public DbSet<RecommendationLog> RecommendationLogs => Set<RecommendationLog>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<ModerationAction> ModerationActions => Set<ModerationAction>();
    public DbSet<UserRefreshToken> UserRefreshTokens => Set<UserRefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Email).HasMaxLength(320);
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.DisplayName).HasMaxLength(100);
            entity.Property(x => x.Role).HasMaxLength(20);
            entity.Property(x => x.Status).HasMaxLength(20);
            entity.Property(x => x.Locale).HasMaxLength(20);
            entity.HasIndex(x => x.Role);
        });

        modelBuilder.Entity<WardrobeItem>(entity =>
        {
            entity.ToTable("items");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(120);
            entity.Property(x => x.Category).HasMaxLength(30);
            entity.Property(x => x.Color).HasMaxLength(30);
            entity.Property(x => x.Status).HasMaxLength(20);
            entity.HasIndex(x => x.UserId);
            entity.HasIndex(x => x.Category);
            entity.HasIndex(x => x.Status);
            entity.HasOne(x => x.User).WithMany(x => x.Items).HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<Outfit>(entity =>
        {
            entity.ToTable("outfits");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(140);
            entity.Property(x => x.Occasion).HasMaxLength(30);
            entity.Property(x => x.Season).HasMaxLength(20);
            entity.Property(x => x.WeatherRange).HasMaxLength(30);
            entity.Property(x => x.ModerationStatus).HasMaxLength(20);
            entity.HasIndex(x => x.UserId);
            entity.HasIndex(x => new { x.ModerationStatus, x.CreatedAt });
            entity.HasOne(x => x.User).WithMany(x => x.Outfits).HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<OutfitItem>(entity =>
        {
            entity.ToTable("outfit_items");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.OutfitId);
            entity.HasIndex(x => x.ItemId);
            entity.HasIndex(x => new { x.OutfitId, x.ItemId }).IsUnique();
            entity.HasOne(x => x.Outfit).WithMany(x => x.OutfitItems).HasForeignKey(x => x.OutfitId);
            entity.HasOne(x => x.Item).WithMany(x => x.OutfitItems).HasForeignKey(x => x.ItemId);
        });

        modelBuilder.Entity<RecommendationLog>(entity =>
        {
            entity.ToTable("recommendation_logs");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Occasion).HasMaxLength(30);
            entity.Property(x => x.Season).HasMaxLength(20);
            entity.Property(x => x.Weather).HasMaxLength(30);
            entity.HasIndex(x => new { x.UserId, x.CreatedAt });
            entity.HasOne(x => x.User).WithMany(x => x.RecommendationLogs).HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.ToTable("feedback");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Reason).HasMaxLength(500);
            entity.HasIndex(x => x.UserId);
            entity.HasIndex(x => x.RecommendationId);
            entity.HasOne(x => x.User).WithMany(x => x.Feedbacks).HasForeignKey(x => x.UserId);
            entity.HasOne(x => x.Recommendation).WithMany().HasForeignKey(x => x.RecommendationId);
        });

        modelBuilder.Entity<ModerationAction>(entity =>
        {
            entity.ToTable("moderation_actions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TargetType).HasMaxLength(20);
            entity.Property(x => x.Action).HasMaxLength(30);
            entity.Property(x => x.Note).HasMaxLength(500);
            entity.HasIndex(x => new { x.TargetType, x.TargetId, x.CreatedAt });
            entity.HasIndex(x => new { x.OperatorUserId, x.CreatedAt });
            entity.HasOne(x => x.OperatorUser).WithMany(x => x.ModerationActions).HasForeignKey(x => x.OperatorUserId);
        });

        modelBuilder.Entity<UserRefreshToken>(entity =>
        {
            entity.ToTable("user_refresh_tokens");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TokenHash).HasMaxLength(128);
            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.ExpiresAt });
            entity.HasOne(x => x.User).WithMany(x => x.RefreshTokens).HasForeignKey(x => x.UserId);
        });
    }
}
