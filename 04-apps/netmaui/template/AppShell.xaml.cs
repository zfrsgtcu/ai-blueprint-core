<!-- PURPOSE OF THIS FILE: Shell code-behind — detail sayfaları için route kaydı. -->
namespace {{ProjectName}};

public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();

        // Detail sayfaları için route kaydı
        Routing.RegisterRoute("{{model_name}}-detail", typeof(Views.{{ModelName}}DetailPage));
    }
}
