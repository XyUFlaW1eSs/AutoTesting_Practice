using AutoTest_Practice_Platform.API.Contracts;
using AutoTest_Practice_Platform.API.Data;
using AutoTest_Practice_Platform.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoTest_Practice_Platform.API.Controllers;

[ApiController]
[Route("api/resources")]
[Authorize]
public sealed class ResourcesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ResourceResponse>>> GetAll([FromQuery] ResourceStatus? status, [FromQuery] string? type)
    {
        var query = db.Resources.AsNoTracking().AsQueryable();
        if (status.HasValue) query = query.Where(x => x.Status == status);
        if (!string.IsNullOrWhiteSpace(type)) query = query.Where(x => x.Type == type);
        return Ok(await query.OrderBy(x => x.Name).Select(x => ResourceResponse.From(x)).ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ResourceResponse>> GetById(Guid id)
    {
        var resource = await db.Resources.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return resource is null ? NotFound() : Ok(ResourceResponse.From(resource));
    }

    [HttpPost]
    public async Task<ActionResult<ResourceResponse>> Create(CreateResourceRequest request)
    {
        var resource = new ResourceItem
        {
            Name = request.Name,
            Type = request.Type,
            Url = request.Url,
            Status = request.Status,
            Tags = request.Tags,
            OwnerId = request.OwnerId
        };
        db.Resources.Add(resource);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = resource.Id }, ResourceResponse.From(resource));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ResourceResponse>> Update(Guid id, UpdateResourceRequest request)
    {
        var resource = await db.Resources.FindAsync(id);
        if (resource is null) return NotFound();
        resource.Name = request.Name;
        resource.Type = request.Type;
        resource.Url = request.Url;
        resource.Status = request.Status;
        resource.Tags = request.Tags;
        resource.OwnerId = request.OwnerId;
        resource.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ResourceResponse.From(resource));
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<ResourceResponse>> Patch(Guid id, PatchResourceRequest request)
    {
        var resource = await db.Resources.FindAsync(id);
        if (resource is null) return NotFound();
        resource.Name = request.Name ?? resource.Name;
        resource.Type = request.Type ?? resource.Type;
        resource.Url = request.Url ?? resource.Url;
        resource.Status = request.Status ?? resource.Status;
        resource.Tags = request.Tags ?? resource.Tags;
        resource.OwnerId = request.OwnerId ?? resource.OwnerId;
        resource.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ResourceResponse.From(resource));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var resource = await db.Resources.FindAsync(id);
        if (resource is null) return NotFound();
        db.Resources.Remove(resource);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
