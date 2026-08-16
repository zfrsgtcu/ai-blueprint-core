// {{ProjectName}} — {{ModelName}} Entity
// AI: Domain entity özelliklerini domain modeline göre tanımla.
// EF Core için navigation property'leri ve foreign key'leri ekle.

namespace {{ProjectName}}.Models;

public class {{ModelName}}
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Audit alanları
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; } = false;
}

// DTO'lar — AI: Domain gereksinimlerine göre özelleştir
public class {{ModelName}}Dto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Create{{ModelName}}Dto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class Update{{ModelName}}Dto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
