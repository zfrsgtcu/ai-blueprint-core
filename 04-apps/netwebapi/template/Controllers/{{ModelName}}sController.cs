// {{ProjectName}} — {{ModelName}} CRUD Controller
// AI: Domain entity'lerine göre her entity için bir controller oluştur.
// Endpoint'leri authorization seviyesine göre [Authorize] attribute ile koru.

using Microsoft.AspNetCore.Mvc;

namespace {{ProjectName}}.Controllers;

[ApiController]
[Route("api/[controller]")]
public class {{ModelName}}sController : ControllerBase
{
    private readonly I{{ModelName}}Service _service;
    private readonly ILogger<{{ModelName}}sController> _logger;

    public {{ModelName}}sController(I{{ModelName}}Service service, ILogger<{{ModelName}}sController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Tüm {{ModelName}} kayıtlarını getir
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<{{ModelName}}Dto>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    /// <summary>
    /// ID'ye göre {{ModelName}} getir
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<{{ModelName}}Dto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result is null)
            return NotFound();
        return Ok(result);
    }

    /// <summary>
    /// Yeni {{ModelName}} oluştur
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<{{ModelName}}Dto>> Create([FromBody] Create{{ModelName}}Dto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// {{ModelName}} güncelle
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<{{ModelName}}Dto>> Update(int id, [FromBody] Update{{ModelName}}Dto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        if (result is null)
            return NotFound();
        return Ok(result);
    }

    /// <summary>
    /// {{ModelName}} sil
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound();
        return NoContent();
    }
}
