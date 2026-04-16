using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OotdPlatform.Api.Migrations
{
    public partial class AddMvpCoreSchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Outfits");

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StylePreferences = table.Column<string[]>(type: "text[]", nullable: false),
                    Locale = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table => { table.PrimaryKey("PK_users", x => x.Id); });

            migrationBuilder.CreateTable(
                name: "items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Category = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Color = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    StyleTags = table.Column<string[]>(type: "text[]", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_items", x => x.Id);
                    table.ForeignKey("FK_items_users_UserId", x => x.UserId, "users", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "moderation_actions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TargetId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    OperatorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_moderation_actions", x => x.Id);
                    table.ForeignKey("FK_moderation_actions_users_OperatorUserId", x => x.OperatorUserId, "users", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "outfits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(140)", maxLength: 140, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Occasion = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Season = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    WeatherRange = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ImageUrls = table.Column<string[]>(type: "text[]", nullable: false),
                    ModerationStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_outfits", x => x.Id);
                    table.ForeignKey("FK_outfits_users_UserId", x => x.UserId, "users", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "recommendation_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    InputItemIds = table.Column<Guid[]>(type: "uuid[]", nullable: false),
                    Occasion = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Season = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Weather = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    StyleHints = table.Column<string[]>(type: "text[]", nullable: false),
                    ResultOutfitIds = table.Column<Guid[]>(type: "uuid[]", nullable: false),
                    LatencyMs = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recommendation_logs", x => x.Id);
                    table.ForeignKey("FK_recommendation_logs_users_UserId", x => x.UserId, "users", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_refresh_tokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_refresh_tokens", x => x.Id);
                    table.ForeignKey("FK_user_refresh_tokens_users_UserId", x => x.UserId, "users", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "outfit_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OutfitId = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_outfit_items", x => x.Id);
                    table.ForeignKey("FK_outfit_items_items_ItemId", x => x.ItemId, "items", "Id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey("FK_outfit_items_outfits_OutfitId", x => x.OutfitId, "outfits", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "feedback",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecommendationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Helpful = table.Column<bool>(type: "boolean", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_feedback", x => x.Id);
                    table.ForeignKey("FK_feedback_recommendation_logs_RecommendationId", x => x.RecommendationId, "recommendation_logs", "Id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey("FK_feedback_users_UserId", x => x.UserId, "users", "Id", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(name: "IX_feedback_RecommendationId", table: "feedback", column: "RecommendationId");
            migrationBuilder.CreateIndex(name: "IX_feedback_UserId", table: "feedback", column: "UserId");
            migrationBuilder.CreateIndex(name: "IX_items_Category", table: "items", column: "Category");
            migrationBuilder.CreateIndex(name: "IX_items_Status", table: "items", column: "Status");
            migrationBuilder.CreateIndex(name: "IX_items_UserId", table: "items", column: "UserId");
            migrationBuilder.CreateIndex(name: "IX_moderation_actions_OperatorUserId_CreatedAt", table: "moderation_actions", columns: new[] { "OperatorUserId", "CreatedAt" });
            migrationBuilder.CreateIndex(name: "IX_moderation_actions_TargetType_TargetId_CreatedAt", table: "moderation_actions", columns: new[] { "TargetType", "TargetId", "CreatedAt" });
            migrationBuilder.CreateIndex(name: "IX_outfit_items_ItemId", table: "outfit_items", column: "ItemId");
            migrationBuilder.CreateIndex(name: "IX_outfit_items_OutfitId", table: "outfit_items", column: "OutfitId");
            migrationBuilder.CreateIndex(name: "IX_outfit_items_OutfitId_ItemId", table: "outfit_items", columns: new[] { "OutfitId", "ItemId" }, unique: true);
            migrationBuilder.CreateIndex(name: "IX_outfits_ModerationStatus_CreatedAt", table: "outfits", columns: new[] { "ModerationStatus", "CreatedAt" });
            migrationBuilder.CreateIndex(name: "IX_outfits_UserId", table: "outfits", column: "UserId");
            migrationBuilder.CreateIndex(name: "IX_recommendation_logs_UserId_CreatedAt", table: "recommendation_logs", columns: new[] { "UserId", "CreatedAt" });
            migrationBuilder.CreateIndex(name: "IX_user_refresh_tokens_TokenHash", table: "user_refresh_tokens", column: "TokenHash", unique: true);
            migrationBuilder.CreateIndex(name: "IX_user_refresh_tokens_UserId_ExpiresAt", table: "user_refresh_tokens", columns: new[] { "UserId", "ExpiresAt" });
            migrationBuilder.CreateIndex(name: "IX_users_Email", table: "users", column: "Email", unique: true);
            migrationBuilder.CreateIndex(name: "IX_users_Role", table: "users", column: "Role");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "feedback");
            migrationBuilder.DropTable(name: "moderation_actions");
            migrationBuilder.DropTable(name: "outfit_items");
            migrationBuilder.DropTable(name: "user_refresh_tokens");
            migrationBuilder.DropTable(name: "recommendation_logs");
            migrationBuilder.DropTable(name: "items");
            migrationBuilder.DropTable(name: "outfits");
            migrationBuilder.DropTable(name: "users");

            migrationBuilder.CreateTable(
                name: "Outfits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: false),
                    Tags = table.Column<string[]>(type: "text[]", nullable: false)
                },
                constraints: table => { table.PrimaryKey("PK_Outfits", x => x.Id); });
        }
    }
}
