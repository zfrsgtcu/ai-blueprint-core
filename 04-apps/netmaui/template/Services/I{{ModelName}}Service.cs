<!-- PURPOSE OF THIS FILE: {{ModelName}} API client service — HTTP çağrıları, typed HttpClient, hata yönetimi. -->
using {{ProjectName}}.Models;

namespace {{ProjectName}}.Services;

public interface I{{ModelName}}Service
{
    Task<List<{{ModelName}}Dto>> GetAllAsync();
    Task<{{ModelName}}Dto?> GetByIdAsync(Guid id);
    Task<{{ModelName}}Dto> CreateAsync(Create{{ModelName}}Dto dto);
    Task<{{ModelName}}Dto> UpdateAsync(Guid id, Update{{ModelName}}Dto dto);
    Task DeleteAsync(Guid id);
}

public class {{ModelName}}Service : I{{ModelName}}Service
{
    private readonly IHttpClientFactory _httpClientFactory;

    public {{ModelName}}Service(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    private HttpClient Client => _httpClientFactory.CreateClient("API");

    public async Task<List<{{ModelName}}Dto>> GetAllAsync()
    {
        var response = await Client.GetAsync("api/{{model_names}}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<{{ModelName}}Dto>>() ?? [];
    }

    public async Task<{{ModelName}}Dto?> GetByIdAsync(Guid id)
    {
        var response = await Client.GetAsync($"api/{{model_names}}/{id}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<{{ModelName}}Dto>();
    }

    public async Task<{{ModelName}}Dto> CreateAsync(Create{{ModelName}}Dto dto)
    {
        var response = await Client.PostAsJsonAsync("api/{{model_names}}", dto);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<{{ModelName}}Dto>()
            ?? throw new InvalidOperationException("API null yanıt döndü.");
    }

    public async Task<{{ModelName}}Dto> UpdateAsync(Guid id, Update{{ModelName}}Dto dto)
    {
        var response = await Client.PutAsJsonAsync($"api/{{model_names}}/{id}", dto);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<{{ModelName}}Dto>()
            ?? throw new InvalidOperationException("API null yanıt döndü.");
    }

    public async Task DeleteAsync(Guid id)
    {
        var response = await Client.DeleteAsync($"api/{{model_names}}/{id}");
        response.EnsureSuccessStatusCode();
    }
}
