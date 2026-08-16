// {{ProjectName}} — Uygulama Giriş Noktası
// AI: CORS policy'sini frontend origin'i ile, JWT ayarlarını production değerleri ile güncelle.
// DbContext provider'ını proje ihtiyacına göre değiştir (SqlServer, PostgreSQL, SQLite).

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FluentValidation;
using FluentValidation.AspNetCore;
using Serilog;
using System.Text;
using {{ProjectName}}.Data;
using {{ProjectName}}.Services;
using {{ProjectName}}.Middleware;

var builder = WebApplication.CreateBuilder(args);

// === SERILOG ===
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();
builder.Host.UseSerilog();

// === DATABASE (EF Core) ===
builder.Services.AddDbContext<AppDbContext>(options =>
    options.Use{{DB_PROVIDER}}(builder.Configuration.GetConnectionString("DefaultConnection")));

// === JWT AUTHENTICATION ===
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

builder.Services.AddAuthorization();

// === CORS ===
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultPolicy", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()!)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// === DEPENDENCY INJECTION (Servisler) ===
// AI: Domain servislerini buraya kaydet
builder.Services.AddScoped<I{{ModelName}}Service, {{ModelName}}Service>();

// === FLUENTVALIDATION ===
builder.Services.AddFluentValidationAutoValidation()
                .AddFluentValidationClientsideAdapters();
// builder.Services.AddValidatorsFromAssemblyContaining<Create{{ModelName}}Validator>();

// === CONTROLLERS + SWAGGER ===
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "{{ProjectName}}", Version = "v1" });
});

// === HEALTH CHECKS ===
builder.Services.AddHealthChecks();

var app = builder.Build();

// === MIDDLEWARE PIPELINE ===
app.UseSerilogRequestLogging();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("DefaultPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
