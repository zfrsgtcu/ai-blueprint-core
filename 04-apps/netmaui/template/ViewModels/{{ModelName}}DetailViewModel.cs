<!-- PURPOSE OF THIS FILE: {{ModelName}} detay ViewModel'i — load detail, edit, delete, confirmation dialog. -->
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using {{ProjectName}}.Models;
using {{ProjectName}}.Services;

namespace {{ProjectName}}.ViewModels;

[QueryProperty(nameof(ItemId), "id")]
public partial class {{ModelName}}DetailViewModel : ObservableObject
{
    private readonly I{{ModelName}}Service _service;

    [ObservableProperty]
    private {{ModelName}}Dto? item;

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private bool isLoaded;

    public {{ModelName}}DetailViewModel(I{{ModelName}}Service service)
    {
        _service = service;
    }

    [RelayCommand]
    private async Task LoadItem(Guid id)
    {
        try
        {
            IsLoading = true;
            IsLoaded = false;
            Item = await _service.GetByIdAsync(id);
            IsLoaded = true;
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Hata", $"Veri yüklenirken hata oluştu: {ex.Message}", "Tamam");
            await Shell.Current.GoToAsync("..");
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task Edit()
    {
        if (Item is null) return;
        await Shell.Current.GoToAsync($"{{model_name}}-edit?id={Item.Id}");
    }

    [RelayCommand]
    private async Task Delete()
    {
        if (Item is null) return;

        var confirmed = await Shell.Current.DisplayAlert(
            "Silme Onayı",
            $"\"{Item.Name}\" silinecek. Bu işlem geri alınamaz.",
            "Sil",
            "İptal");

        if (!confirmed) return;

        try
        {
            await _service.DeleteAsync(Item.Id);
            await Shell.Current.DisplayAlert("Başarılı", "Kayıt başarıyla silindi.", "Tamam");
            await Shell.Current.GoToAsync("..");
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Hata", $"Silme sırasında hata oluştu: {ex.Message}", "Tamam");
        }
    }
}
