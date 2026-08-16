<!-- PURPOSE OF THIS FILE: Blazor WebAssembly uygulamasının giriş noktası — DI kaydı, HttpClient yapılandırması, auth ve root component render. -->
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using {{ProjectName}};

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// HttpClient — API base URL appsettings'ten veya environment variable'dan
builder.Services.AddScoped(sp => new HttpClient
{
    BaseAddress = new Uri(builder.Configuration["ApiBaseUrl"] ?? "{{API_BASE_URL}}")
});

// Typed HttpClient servisleri — her entity için
builder.Services.AddScoped<I{{ModelName}}Service, {{ModelName}}Service>();

// Auth (JWT Bearer)
builder.Services.AddAuthorizationCore();
builder.Services.AddScoped<CustomAuthenticationStateProvider>();
builder.Services.AddScoped<AuthenticationStateProvider>(sp =>
    sp.GetRequiredService<CustomAuthenticationStateProvider>());

// Local storage (opsiyonel — Blazored.LocalStorage)
// builder.Services.AddBlazoredLocalStorage();

await builder.Build().RunAsync();
