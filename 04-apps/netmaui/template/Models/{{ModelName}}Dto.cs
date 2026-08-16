<!-- PURPOSE OF THIS FILE: {{ModelName}} DTO sınıfları — API'den gelen/giden veri transfer objeleri. -->
namespace {{ProjectName}}.Models;

public class {{ModelName}}Dto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
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
