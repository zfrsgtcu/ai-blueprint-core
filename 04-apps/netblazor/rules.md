<!--
  BU DOSYANIN AMACI:
  AI ajanlarına Blazor WebAssembly 8.0 ile proje geliştirirken uyması gereken best practice kurallarını öğretir.
  Razor component yapısı, HttpClient kullanımı, state management, auth,
  ve Azure Static Web Apps deployment kurallarını kapsar.
-->

# BLAZOR WEBASSEMBLY 8.0 — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

Blazor WebAssembly, C# kodunun WebAssembly üzerinde tarayıcıda çalıştığı client-side SPA framework'üdür. .NET ekosisteminde tam stack C# kullanmak isteyen ekipler içindir. SEO kritik değilse, kurumsal iç araçlar ve admin panel'ler için idealdir.

1. 🔴 **ZORUNLU:** Component'ler `.razor` uzantılı, `@page` direktifi ile routing.
2. 🔴 **ZORUNLU:** API çağrıları için typed `HttpClient` kullan, DI'dan al.
3. 🔴 **ZORUNLU:** `@code` bloklarını küçük tut — kompleks logic'i `Services/` altına taşı.
4. 🔴 **ZORUNLU:** `async` lifecycle methods: `OnInitializedAsync`, `OnParametersSetAsync`.

## 2. COMPONENT YAPISI KURALLARI

1. 🔴 **ZORUNLU:** Sayfa component'leri `Pages/` altında, `@page "/route"` ile routing.
2. 🔴 **ZORUNLU:** Paylaşılan component'ler `Shared/` altında.
3. 🟡 **ÖNERİLEN:** Component parametreleri `[Parameter]` attribute ile.
4. 🟡 **ÖNERİLEN:** Event callback'ler `[Parameter] EventCallback<T>` ile parent-child iletişim.
5. 🟠 **YASAK:** `@code` bloğunda direkt HttpClient kullanmak — service üzerinden.

```razor
@* Pages/{{ModelName}}s.razor — CRUD Sayfası ÖRNEK *@
@page "/{{model_names}}"
@inject I{{ModelName}}Service {{ModelName}}Service

<h1>{{ModelName}} Yönetimi</h1>

@if (items is null)
{
    <p>Yükleniyor...</p>
}
else
{
    <table>
        ...
    </table>
}

@code {
    private List<{{ModelName}}Dto>? items;

    protected override async Task OnInitializedAsync()
    {
        items = await {{ModelName}}Service.GetAllAsync();
    }
}
```

## 3. HTTP CLIENT KURALLARI

1. 🔴 **ZORUNLU:** `Program.cs`'te HttpClient base URL yapılandırılmalı.
2. 🔴 **ZORUNLU:** Typed HttpClient servisleri — `AddHttpClient<IService, Service>()`.
3. 🔴 **ZORUNLU:** API hatalarını try-catch ile yönet, kullanıcıya anlamlı mesaj göster.
4. 🟠 **YASAK:** `Program.cs`'te `BaseAddress` sabit kodlanmış — `appsettings.json`'dan veya env variable'dan al.

```csharp
// Program.cs HttpClient kaydı
builder.Services.AddScoped(sp => new HttpClient
{
    BaseAddress = new Uri(builder.Configuration["ApiBaseUrl"] ?? "{{API_BASE_URL}}")
});
```

## 4. STATE MANAGEMENT KURALLARI

1. 🔴 **ZORUNLU:** Component state (`private` fields, `[Parameter]` properties) component içinde kalır.
2. 🟡 **ÖNERİLEN:** Sayfalar arası state için DI singleton container service.
3. 🟡 **ÖNERİLEN:** Local storage için `Blazored.LocalStorage` kullan.
4. 🟠 **YASAK:** State'i `wwwroot/` JavaScript üzerinden yönetmek — C# tarafında kal.

## 5. AUTHENTICATION KURALLARI

1. 🔴 **ZORUNLU:** JWT token `localStorage` veya `ProtectedLocalStorage`'da tutulur.
2. 🔴 **ZORUNLU:** `AuthorizationMessageHandler` ile otomatik Bearer token ekleme.
3. 🔴 **ZORUNLU:** `[Authorize]` attribute ile korunan sayfalar.
4. 🟡 **ÖNERİLEN:** `AuthenticationStateProvider` custom implementasyonu.

## 6. STYLING KURALLARI

1. 🔴 **ZORUNLU:** TailwindCSS kullan (proje standardı) — standalone CSS dosyası `wwwroot/app.css`.
2. 🟡 **ÖNERİLEN:** Component başına scoped CSS: `{{ModelName}}s.razor.css`.
3. 🟡 **ÖNERİLEN:** UI component kütüphanesi: MudBlazor (Material Design) veya Blazorise.

## 7. PERFORMANS KURALLARI

1. 🔴 **ZORUNLU:** `ShouldRender()` override ile gereksiz render'ları engelle.
2. 🟡 **ÖNERİLEN:** Büyük listeler için virtualize: `<Virtualize Items="@items">`.
3. 🟡 **ÖNERİLEN:** AOT compilation (production build): `<RunAOTCompilation>true</RunAOTCompilation>`.
4. 🟠 **YASAK:** `StateHasChanged()` çok sık çağırmak — performans sorunu.

## 8. DEPLOYMENT KURALLARI (Azure Static Web Apps)

1. 🔴 **ZORUNLU:** Build: `dotnet publish -c Release -o ./publish`.
2. 🔴 **ZORUNLU:** Output: `publish/wwwroot/`, `staticwebapp.config.json` ile routing.
3. 🔴 **ZORUNLU:** WASM dosyaları için `.wasm` MIME type ve `application/wasm` content type.

## 9. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **Component'te direkt `new HttpClient()`** — DI kullan.
2. ❌ **`OnInitializedAsync`'te await yok** — UI thread bloklanır.
3. ❌ **Büyük DLL'ler** — lazy load assembly'ler ile ilk yükleme süresini azalt.
4. ❌ **JavaScript interop bağımlılığı** — mümkün olduğunca C# tarafında kal, `IJSRuntime` sadece gerekli.
5. ❌ **`StateHasChanged` döngüsü** — parameter değişince otomatik render, manuel çağırma.
6. ❌ **Exception swallowing** — hataları yakala, kullanıcıya bildir.

## 10. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu Blazor WebAssembly projesinde şunları kontrol etmelidir:

- [ ] `Program.cs` mevcut — DI kayıtları, HttpClient, auth
- [ ] `App.razor` mevcut — `<Router>` ve `<Found>` / `<NotFound>`
- [ ] `_Imports.razor` mevcut — global using'ler
- [ ] `Pages/Index.razor` ana sayfa mevcut
- [ ] `Shared/MainLayout.razor` layout mevcut
- [ ] `Shared/NavMenu.razor` navigasyon menüsü mevcut
- [ ] `Services/` klasörü mevcut — API client servisleri
- [ ] `Models/` klasörü mevcut — DTO'lar
- [ ] `wwwroot/app.css` mevcut — TailwindCSS
- [ ] `{{ProjectName}}.csproj` mevcut — `net8.0`, gerekli NuGet paketleri
