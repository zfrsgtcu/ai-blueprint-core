<!-- PURPOSE OF THIS FILE: {{ModelName}}DetailPage code-behind — minimal, DI'dan ViewModel alır. -->
using {{ProjectName}}.ViewModels;

namespace {{ProjectName}}.Views;

[QueryProperty(nameof(ItemId), "id")]
public partial class {{ModelName}}DetailPage : ContentPage
{
    private readonly {{ModelName}}DetailViewModel _viewModel;

    public {{ModelName}}DetailPage({{ModelName}}DetailViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = viewModel;
    }

    public string ItemId
    {
        set
        {
            if (Guid.TryParse(value, out var id))
            {
                _viewModel.LoadItemCommand.Execute(id);
            }
        }
    }
}
