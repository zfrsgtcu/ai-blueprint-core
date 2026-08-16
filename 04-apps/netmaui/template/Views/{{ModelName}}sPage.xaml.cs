<!-- PURPOSE OF THIS FILE: {{ModelName}}sPage code-behind — minimal, DI'dan ViewModel alır. -->
using {{ProjectName}}.ViewModels;

namespace {{ProjectName}}.Views;

public partial class {{ModelName}}sPage : ContentPage
{
    public {{ModelName}}sPage({{ModelName}}ListViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        if (BindingContext is {{ModelName}}ListViewModel vm)
        {
            vm.LoadItemsCommand.Execute(null);
        }
    }
}
