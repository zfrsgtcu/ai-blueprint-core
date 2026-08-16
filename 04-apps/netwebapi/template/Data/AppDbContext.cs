// {{ProjectName}} — Entity Framework DbContext
// AI: Domain entity'lerine göre DbSet property'lerini ekle.
// Entity konfigürasyonları için IEntityTypeConfiguration<T> kullan (tercih edilen).

using Microsoft.EntityFrameworkCore;
using {{ProjectName}}.Models;

namespace {{ProjectName}}.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Domain entity'leri — AI: Her entity için DbSet ekle
    public DbSet<{{ModelName}}> {{ModelName}}s => Set<{{ModelName}}>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // === {{ModelName}} Konfigürasyonu ===
        modelBuilder.Entity<{{ModelName}}>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);

            // Soft delete filter — aktif kayıtlar
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // AI: Diğer entity konfigürasyonlarını buraya ekle

        // Otomatik entity konfigürasyonu (IEntityTypeConfiguration)
        // modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Audit: UpdatedAt otomatik güncelle
        foreach (var entry in ChangeTracker.Entries<{{ModelName}}>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
