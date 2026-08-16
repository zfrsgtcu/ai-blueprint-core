<!-- PURPOSE OF THIS FILE: {{ModelName}} liste ViewModel'i — CommunityToolkit.Mvvm ile, load, add, select işlemleri. -->
using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using {{ProjectName}}.Models;
using {{ProjectName}}.Services;

namespace {{ProjectName}}.ViewModels;

public partial class {{ModelName}}ListViewModel : ObservableObject
{
    private readonly I{{ModelName}}Service _service;

    [ObservableProperty]
    private ObservableCollection<{{ModelName}}Dto> items = [];

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private bool isRefreshing;

    [ObservableProperty]
    private bool hasError;

    [ObservableProperty]
    private string? errorMessage;

    public bool IsEmpty => !IsLoading && !HasError && Items.Count == 0;

    public {{ModelName}}ListViewModel(I{{ModelName}}Service service)
    {
        _service = service;
    }

    [RelayCommand]
    private async Task LoadItems()
    {
        try
        {
            HasError = false;
            IsLoading = !IsRefreshing;

            // Offline-first: önce SQLite'dan oku
            // var localItems = await _db.Get{{ModelName}}sAsync();
            // Items = new ObservableCollection<{{ModelName}}Dto>(localItems);

            // Sonra API'den güncelle
            var apiItems = await _service.GetAllAsync();
            Items = new ObservableCollection<{{ModelName}}Dto>(apiItems);

            OnPropertyChanged(nameof(IsEmpty));
        }
        catch (Exception ex)
        {
            HasError = true;
            ErrorMessage = $"Veri yüklenirken hata oluştu: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
            IsRefreshing = false;
        }
    }

    [RelayCommand]
    private async Task Add()
    {
        await Shell.Current.GoToAsync("{{model_name}}-edit");
    }

    [RelayCommand]
    private async Task ItemSelected({{ModelName}}Dto? item)
    {
        if (item is null) return;
        await Shell.Current.GoToAsync($"{{model_name}}-detail?id={item.Id}");
    }
}
