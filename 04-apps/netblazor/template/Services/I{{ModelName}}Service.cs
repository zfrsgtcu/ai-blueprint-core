<!-- PURPOSE OF THIS FILE: {{ModelName}} API client interface — typed HttpClient service sözleşmesi. -->
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
    private readonly HttpClient _http;

    public {{ModelName}}Service(HttpClient http)
    {
        _http = http;
    }

    public async Task<List<{{ModelName}}Dto>> GetAllAsync()
    {
        return await _http.GetFromJsonAsync<List<{{ModelName}}Dto>>("api/{{model_names}}") ?? [];
    }

    public async Task<{{ModelName}}Dto?> GetByIdAsync(Guid id)
    {
        return await _http.GetFromJsonAsync<{{ModelName}}Dto>($"api/{{model_names}}/{id}");
    }

    public async Task<{{ModelName}}Dto> CreateAsync(Create{{ModelName}}Dto dto)
    {
        var response = await _http.PostAsJsonAsync("api/{{model_names}}", dto);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<{{ModelName}}Dto>()
            ?? throw new InvalidOperationException("API null yanıt döndü.");
    }

    public async Task<{{ModelName}}Dto> UpdateAsync(Guid id, Update{{ModelName}}Dto dto)
    {
        var response = await _http.PutAsJsonAsync($"api/{{model_names}}/{id}", dto);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<{{ModelName}}Dto>()
            ?? throw new InvalidOperationException("API null yanıt döndü.");
    }

    public async Task DeleteAsync(Guid id)
    {
        var response = await _http.DeleteAsync($"api/{{model_names}}/{id}");
        response.EnsureSuccessStatusCode();
    }
}
