<!-- PURPOSE OF THIS FILE: .NET MAUI uygulamasının giriş noktası — DI kaydı, HttpClient, fontlar, platform konfigürasyonu. -->
using CommunityToolkit.Maui;
using Microsoft.Extensions.Logging;

namespace {{ProjectName}};

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // HttpClient — API base URL
        builder.Services.AddHttpClient("API", client =>
        {
            client.BaseAddress = new Uri("{{API_BASE_URL}}");
        });

        // Typed HttpClient servisleri
        builder.Services.AddSingleton<I{{ModelName}}Service, {{ModelName}}Service>();

        // ViewModel'ler — Dependency Injection üzerinden
        builder.Services.AddTransient<{{ModelName}}ListViewModel>();
        builder.Services.AddTransient<{{ModelName}}DetailViewModel>();

        // Sayfalar
        builder.Services.AddTransient<Views.{{ModelName}}sPage>();
        builder.Services.AddTransient<Views.{{ModelName}}DetailPage>();

        // Local DB (SQLite) — offline-first
        // builder.Services.AddSingleton<LocalDatabase>();

        // ConnectivityService
        // builder.Services.AddSingleton<IConnectivityService, ConnectivityService>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
