using AutoTest_Practice_Platform.API.Contracts;
using AutoTest_Practice_Platform.API.Data;
using AutoTest_Practice_Platform.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoTest_Practice_Platform.API.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public sealed class FilesController(AppDbContext db, IWebHostEnvironment environment) : ControllerBase
{
    private static readonly HashSet<string> ImageTypes = new(StringComparer.OrdinalIgnoreCase) { "image/jpeg", "image/png", "image/webp" };
    private static readonly HashSet<string> FileTypes = new(StringComparer.OrdinalIgnoreCase) { "application/pdf", "text/plain", "text/csv", "application/json", "application/zip", "image/jpeg", "image/png", "image/webp" };
    private const long MaxBytes = 10 * 1024 * 1024;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FileAssetResponse>>> GetAll() =>
        Ok(await db.Files.AsNoTracking().OrderByDescending(x => x.CreatedAt).Select(x => FileAssetResponse.From(x)).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FileAssetResponse>> GetById(Guid id)
    {
        var file = await db.Files.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return file is null ? NotFound() : Ok(FileAssetResponse.From(file));
    }

    [HttpPost("upload")]
    [RequestSizeLimit(MaxBytes)]
    public Task<ActionResult<FileAssetResponse>> Upload(IFormFile file) => SaveUploadAsync(file, "file", FileTypes);

    [HttpPost("upload-image")]
    [RequestSizeLimit(MaxBytes)]
    public Task<ActionResult<FileAssetResponse>> UploadImage(IFormFile file) => SaveUploadAsync(file, "image", ImageTypes);

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        var file = await db.Files.FindAsync(id);
        if (file is null || !System.IO.File.Exists(file.StoragePath)) return NotFound();
        return PhysicalFile(file.StoragePath, file.ContentType, file.OriginalFileName);
    }

    [HttpGet("{id:guid}/preview")]
    public async Task<IActionResult> Preview(Guid id)
    {
        var file = await db.Files.FindAsync(id);
        if (file is null || !System.IO.File.Exists(file.StoragePath)) return NotFound();
        if (!ImageTypes.Contains(file.ContentType)) return BadRequest(new { message = "Only images can be previewed." });
        return PhysicalFile(file.StoragePath, file.ContentType);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var file = await db.Files.FindAsync(id);
        if (file is null) return NotFound();
        if (System.IO.File.Exists(file.StoragePath)) System.IO.File.Delete(file.StoragePath);
        db.Files.Remove(file);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<ActionResult<FileAssetResponse>> SaveUploadAsync(IFormFile file, string category, HashSet<string> allowedTypes)
    {
        if (file.Length <= 0 || file.Length > MaxBytes)
        {
            return BadRequest(new { message = "File must be between 1 byte and 10 MB." });
        }

        if (!allowedTypes.Contains(file.ContentType))
        {
            return BadRequest(new { message = $"Unsupported content type: {file.ContentType}" });
        }

        var uploadRoot = Path.Combine(environment.ContentRootPath, "Uploads", category);
        Directory.CreateDirectory(uploadRoot);
        var extension = Path.GetExtension(file.FileName);
        var storedName = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(uploadRoot, storedName);
        await using (var stream = System.IO.File.Create(path))
        {
            await file.CopyToAsync(stream);
        }

        var asset = new FileAsset
        {
            OriginalFileName = Path.GetFileName(file.FileName),
            StoredFileName = storedName,
            ContentType = file.ContentType,
            Size = file.Length,
            Category = category,
            StoragePath = path
        };
        db.Files.Add(asset);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = asset.Id }, FileAssetResponse.From(asset));
    }
}
