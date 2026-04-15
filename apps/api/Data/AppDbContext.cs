using Microsoft.EntityFrameworkCore;
using OotdPlatform.Api.Models; // 確保與你的 Model 命名空間一致

namespace OotdPlatform.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Outfit> Outfits => Set<Outfit>();
}