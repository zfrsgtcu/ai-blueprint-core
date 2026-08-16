<!--
  BU DOSYANIN AMACI:
  AI ajanlarına .NET 8 Web API ile proje geliştirirken uyması gereken best practice kurallarını öğretir.
  Controller yapısı, EF Core, JWT auth, FluentValidation, Serilog, CORS, exception handling
  ve Azure Container Apps deployment kurallarını kapsar.
-->

# .NET 8 WEB API — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

.NET 8 Web API, kurumsal REST API'ler için Microsoft'un modern framework'üdür. Controller-based yaklaşım tercih edilir. Minimal API sadece basit senaryolarda (tek endpoint, mikroservis).

1. 🔴 **ZORUNLU:** Controller-based yaklaşım kullan — `ControllerBase`'ten türe.
2. 🔴 **ZORUNLU:** Attribute routing: `[Route("api/[controller]")]` ve `[ApiController]`.
3. 🔴 **ZORUNLU:** Dependency Injection — constructor injection ile servisleri al.
4. 🔴 **ZORUNLU:** Async/await tüm I/O operasyonlarında (EF Core, HTTP, dosya).

```csharp
// Controller yapısı — ZORUNLU STANDART
[ApiController]
[Route("api/[controller]")]
public class {{ModelName}}sController : ControllerBase
{
    private readonly I{{ModelName}}Service _service;

    public {{ModelName}}sController(I{{ModelName}}Service service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<{{ModelName}}Dto>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }
}
```

## 2. ENTITY FRAMEWORK CORE KURALLARI

1. 🔴 **ZORUNLU:** `DbContext` sınıfı `Data/` klasöründe.
2. 🔴 **ZORUNLU:** Connection string `appsettings.json`'da, production'da environment variable veya Azure Key Vault.
3. 🔴 **ZORUNLU:** Migration'lar `dotnet ef migrations add` ile yönetilmeli.
4. 🟡 **ÖNERİLEN:** Repository pattern — `IRepository<T>` interface ve `Repository<T>` implementasyonu.
5. 🟠 **YASAK:** Controller'da direkt DbContext kullanmak — Service/Repository katmanı zorunlu.
6. 🟡 **ÖNERİLEN:** `AsNoTracking()` ile read-only sorgularda performans.

```csharp
// Data/AppDbContext.cs — ÖRNEK
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<{{ModelName}}> {{ModelName}}s { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
```

## 3. JWT AUTHENTICATION KURALLARI

1. 🔴 **ZORUNLU:** JWT Bearer authentication — `Microsoft.AspNetCore.Authentication.JwtBearer`.
2. 🔴 **ZORUNLU:** JWT secret en az 256-bit, `appsettings.json`'da DEĞİL, environment variable'da.
3. 🔴 **ZORUNLU:** Hassas endpoint'ler `[Authorize]` attribute ile korunmalı.
4. 🟡 **ÖNERİLEN:** Refresh token mekanizması — access token kısa ömürlü (15 dk), refresh token uzun (7 gün).
5. 🟡 **ÖNERİLEN:** Role-based authorization: `[Authorize(Roles = "Admin")]`.

```csharp
// Program.cs JWT kaydı
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };
    });
```

## 4. FLUENTVALIDATION KURALLARI

1. 🔴 **ZORUNLU:** Her request DTO'su için FluentValidation validator sınıfı.
2. 🔴 **ZORUNLU:** Validator'lar `Validators/` klasöründe, `AbstractValidator<T>`'ten türemeli.
3. 🔴 **ZORUNLU:** `Program.cs`'te `AddFluentValidationAutoValidation()` ile otomatik pipeline.
4. 🟡 **ÖNERİLEN:** Custom validator'lar tekrar kullanılabilir olmalı.

```csharp
// Validators/Create{{ModelName}}Validator.cs — ÖRNEK
public class Create{{ModelName}}Validator : AbstractValidator<Create{{ModelName}}Dto>
{
    public Create{{ModelName}}Validator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ad zorunludur")
            .MaximumLength(200);
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();
    }
}
```

## 5. SERILOG KURALLARI

1. 🔴 **ZORUNLU:** Serilog yapılandırılmış loglama için kullanılmalı.
2. 🔴 **ZORUNLU:** `appsettings.json`'da log seviyesi ve sink'ler tanımlanmalı.
3. 🟡 **ÖNERİLEN:** Request/Response logging middleware ile otomatik.
4. 🟠 **YASAK:** `Console.WriteLine` veya `Debug.WriteLine` kullanmak — Serilog üzerinden.

```csharp
// Program.cs Serilog kaydı
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();
builder.Host.UseSerilog();
```

## 6. EXCEPTION HANDLING KURALLARI

1. 🔴 **ZORUNLU:** Global exception handling middleware — exception'ları yakala, ProblemDetails döndür.
2. 🔴 **ZORUNLU:** Controller'da try-catch yazma — middleware halletmeli.
3. 🟡 **ÖNERİLEN:** Custom exception sınıfları (NotFoundException, ValidationException, UnauthorizedException).
4. 🟠 **YASAK:** Exception mesajında stack trace döndürmek (production'da).

## 7. CORS KURALLARI

1. 🔴 **ZORUNLU:** Frontend domain'i için CORS policy tanımlanmalı.
2. 🔴 **ZORUNLU:** Production'da wildcard (`*`) kullanılmamalı — belirli origin'ler.
3. 🟡 **ÖNERİLEN:** `appsettings.json`'da `AllowedOrigins` listesi.

## 8. DEPLOYMENT KURALLARI (Azure Container Apps)

1. 🔴 **ZORUNLU:** Dockerfile ile containerize et. Multi-stage build.
2. 🔴 **ZORUNLU:** Environment variables: `ASPNETCORE_ENVIRONMENT`, `ConnectionStrings__DefaultConnection`.
3. 🔴 **ZORUNLU:** Health check endpoint: `/health` (liveness) ve `/health/ready` (readiness).
4. 🟡 **ÖNERİLEN:** Application Insights telemetri.

## 9. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **Controller'da direkt `new DbContext()`** — DI kullan.
2. ❌ **Senkron EF Core çağrıları** — `ToList()` yerine `ToListAsync()`.
3. ❌ **Exception mesajını client'a döndürmek** — güvenlik açığı.
4. ❌ **Migration'ları unutmak** — veritabanı şemasını güncellemeyi atlamak.
5. ❌ **CORS'u yapılandırmadan bırakmak** — frontend API'ye ulaşamaz.
6. ❌ **`appsettings.json`'da secret tutmak** — environment variable kullan.
7. ❌ **N+1 query — EF Core'da `Include()` kullanmamak** — performans sorunu.

## 10. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu .NET Web API projesinde şunları kontrol etmelidir:

- [ ] `Program.cs` mevcut — DI kayıtları, middleware pipeline, CORS, auth
- [ ] `appsettings.json` ve `appsettings.Development.json` mevcut
- [ ] `{{ProjectName}}.csproj` mevcut — `net8.0`, gerekli NuGet paketleri
- [ ] `Controllers/` klasörü mevcut — `[ApiController]` ve `[Route]` attribute'leri
- [ ] `Models/` klasörü mevcut — Entity + DTO sınıfları
- [ ] `Services/` klasörü mevcut — Interface + Implementasyon
- [ ] `Data/` klasörü mevcut — `AppDbContext`
- [ ] `Validators/` klasörü mevcut
- [ ] `Middleware/` klasörü mevcut (global exception handler)
- [ ] JWT auth DI'da kayıtlı
- [ ] FluentValidation pipeline'a eklenmiş
- [ ] Serilog yapılandırılmış
- [ ] Dockerfile mevcut (Azure Container Apps için)
