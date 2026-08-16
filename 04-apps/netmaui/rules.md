<!--
  BU DOSYANIN AMACI:
  AI ajanlarına .NET MAUI 8.0 ile cross-platform mobil uygulama geliştirirken uyması gereken best practice kurallarını öğretir.
  MVVM mimarisi, XAML UI, CommunityToolkit, Shell navigation, offline-first (SQLite),
  ve platform-specific deployment kurallarını kapsar.
-->

# .NET MAUI 8.0 — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

.NET MAUI, C# ve XAML ile iOS, Android, Windows ve macOS için native cross-platform uygulama geliştirme framework'üdür. MVVM mimarisi, Shell navigasyon ve dependency injection ile kurumsal mobil çözümler için idealdir.

1. 🔴 **ZORUNLU:** MVVM mimarisi — View (.xaml) ↔ ViewModel (.cs) ↔ Model.
2. 🔴 **ZORUNLU:** CommunityToolkit.Mvvm kullan — `[ObservableProperty]`, `[RelayCommand]` source generator'lar.
3. 🔴 **ZORUNLU:** Dependency Injection — `MauiProgram.cs`'te tüm servisler kaydedilmeli.
4. 🔴 **ZORUNLU:** Shell navigasyon — `AppShell.xaml` ile route tabanlı gezinme.

## 2. MVVM KURALLARI (CommunityToolkit.Mvvm)

1. 🔴 **ZORUNLU:** ViewModel'ler `ObservableObject`'ten türemeli.
2. 🔴 **ZORUNLU:** Property'ler `[ObservableProperty]` attribute ile (source generator).
3. 🔴 **ZORUNLU:** Command'lar `[RelayCommand]` attribute ile (source generator).
4. 🟠 **YASAK:** View code-behind'da iş mantığı — ViewModel'de olmalı.
5. 🟡 **ÖNERİLEN:** `WeakReferenceMessenger` ile ViewModel'ler arası mesajlaşma.

```csharp
// ViewModels/{{ModelName}}ListViewModel.cs — ÖRNEK
public partial class {{ModelName}}ListViewModel : ObservableObject
{
    private readonly I{{ModelName}}Service _service;

    [ObservableProperty]
    private ObservableCollection<{{ModelName}}Dto> items = [];

    [ObservableProperty]
    private bool isLoading;

    public {{ModelName}}ListViewModel(I{{ModelName}}Service service)
    {
        _service = service;
    }

    [RelayCommand]
    private async Task LoadItems()
    {
        IsLoading = true;
        var result = await _service.GetAllAsync();
        Items = new ObservableCollection<{{ModelName}}Dto>(result);
        IsLoading = false;
    }
}
```

## 3. XAML UI KURALLARI

1. 🔴 **ZORUNLU:** Binding `{Binding PropertyName}` ile, Mode=TwoWay gerektiğinde.
2. 🔴 **ZORUNLU:** `x:DataType` ile compiled binding (performans).
3. 🟡 **ÖNERİLEN:** `ResourceDictionary` ile tutarlı stil/renk yönetimi.
4. 🟡 **ÖNERİLEN:** Responsive layout: Grid, FlexLayout, StackLayout.
5. 🟠 **YASAK:** AbsoluteLayout sabit koordinatlar — responsive değil.

## 4. SHELL NAVIGATION KURALLARI

1. 🔴 **ZORUNLU:** `AppShell.xaml` ile ana navigasyon yapısı.
2. 🔴 **ZORUNLU:** `Shell.Current.GoToAsync()` ile programatik navigasyon.
3. 🟡 **ÖNERİLEN:** Query parameter'lar `[QueryProperty]` ile ViewModel'e aktarılır.
4. 🟡 **ÖNERİLEN:** TabBar (alt sekmeler) ve Flyout (yan menü) Shell ile tanımlanır.

```xml
<!-- AppShell.xaml -->
<Shell>
    <TabBar>
        <ShellContent Title="Ana Sayfa" ContentTemplate="{DataTemplate views:HomePage}" Route="home" />
        <ShellContent Title="{{ModelName}}s" ContentTemplate="{DataTemplate views:{{ModelName}}sPage}" Route="{{model_names}}" />
    </TabBar>
</Shell>
```

## 5. HTTP CLIENT KURALLARI

1. 🔴 **ZORUNLU:** Typed HttpClient — `builder.Services.AddHttpClient<IService, Service>()`.
2. 🔴 **ZORUNLU:** `MauiProgram.cs`'te base URL yapılandırılmalı.
3. 🔴 **ZORUNLU:** Network yoksa offline moda geç — try-catch ile yönet.
4. 🟡 **ÖNERİLEN:** Polly ile retry ve circuit breaker.

## 6. OFFLINE-FIRST (SQLITE) KURALLARI
1. 🔴 **ZORUNLU:** `sqlite-net-pcl` ile lokal veritabanı.
2. 🔴 **ZORUNLU:** Veri önce SQLite'a yazılır → sonra API'ye senkronize edilir.
3. 🔴 **ZORUNLU:** `Connectivity.Current.NetworkAccess` ile bağlantı kontrolü.
4. 🟡 **ÖNERİLEN:** Sync queue — başarısız API çağrıları kuyruğa alınır, tekrar denenir.

## 7. PLATFORM-SPECIFIC KURALLAR

1. 🟡 **ÖNERİLEN:** `#if ANDROID` / `#if IOS` conditional compilation.
2. 🟡 **ÖNERİLEN:** `Platforms/` altında platform-specific kod.
3. 🟠 **YASAK:** Platform-specific API'yi shared code'da kullanmak — abstraction layer.

## 8. DEPLOYMENT KURALLARI

1. 🔴 **ZORUNLU:** Android: `dotnet publish -f net8.0-android -c Release` → .aab.
2. 🔴 **ZORUNLU:** iOS: `dotnet publish -f net8.0-ios -c Release` → .ipa (macOS build host gerekli).
3. 🔴 **ZORUNLU:** App icon ve splash screen `Resources/` altında.

## 9. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **View code-behind'da iş mantığı** — MVVM'e aykırı, test edilemez.
2. ❌ **`new HttpClient()` her seferinde** — DI ile singleton/typed client.
3. ❌ **Main thread'de uzun işlem** — UI donar, async kullan.
4. ❌ **Platform farklılıklarını görmezden gelmek** — iOS/Android davranış farkları.
5. ❌ **Offline durumu yönetmemek** — kullanıcıya anlamlı mesaj göstermek.
6. ❌ **`x:DataType` kullanmamak** — reflection ile binding, performans kaybı.

## 10. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu .NET MAUI projesinde şunları kontrol etmelidir:

- [ ] `MauiProgram.cs` mevcut — DI kayıtları, MAUI builder
- [ ] `App.xaml` ve `App.xaml.cs` mevcut — Resources, MainPage ataması
- [ ] `AppShell.xaml` ve `AppShell.xaml.cs` mevcut — Shell navigasyon
- [ ] `Views/` klasörü mevcut — .xaml sayfaları
- [ ] `ViewModels/` klasörü mevcut — CommunityToolkit.Mvvm ViewModel'ler
- [ ] `Models/` klasörü mevcut — Domain entity/DTO
- [ ] `Services/` klasörü mevcut — API client, local DB
- [ ] `Converters/` klasörü mevcut — gerekli value converter'lar
- [ ] `Platforms/` klasörü mevcut — Android, iOS, Windows, MacCatalyst
- [ ] `Resources/` altında app icon, splash, font, renk tanımları
- [ ] `{{ProjectName}}.csproj` mevcut — `net8.0-android;net8.0-ios;...`
- [ ] CommunityToolkit.Mvvm ve CommunityToolkit.Maui NuGet paketleri eklenmiş
