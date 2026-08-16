<!-- PURPOSE OF THIS FILE: .NET MAUI App code-behind — MainPage ataması. -->
namespace {{ProjectName}};

public partial class App : Application
{
    public App()
    {
        InitializeComponent();
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        return new Window(new AppShell());
    }
}
