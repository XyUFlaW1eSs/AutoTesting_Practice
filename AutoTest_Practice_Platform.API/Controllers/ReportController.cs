using AutoTest_Practice_Platform.API.Contracts;
using AutoTest_Practice_Platform.API.Data;
using AutoTest_Practice_Platform.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoTest_Practice_Platform.API.Controllers;

[ApiController]
[Route("api/report")]
[Authorize]
public sealed class ReportController(AppDbContext db) : ControllerBase
{
    [HttpPost("generate")]
    [AllowAnonymous]
    public async Task<ActionResult<ReportResponse>> Generate(GenerateReportRequest request)
    {
        var delay = Random.Shared.Next(2000, 5001);
        await Task.Delay(delay);
        var report = new ReportRecord
        {
            Title = string.IsNullOrWhiteSpace(request.Title) ? "Synthetic report" : request.Title,
            Status = "Completed",
            DurationMs = delay,
            Summary = $"Report generated after {delay} ms for performance and wait-strategy training."
        };
        db.Reports.Add(report);
        await db.SaveChangesAsync();
        return Ok(ReportResponse.From(report));
    }

    [HttpGet("history")]
    public async Task<ActionResult<IEnumerable<ReportResponse>>> History() =>
        Ok(await db.Reports.AsNoTracking().OrderByDescending(x => x.CreatedAt).Select(x => ReportResponse.From(x)).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReportResponse>> GetById(Guid id)
    {
        var report = await db.Reports.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return report is null ? NotFound() : Ok(ReportResponse.From(report));
    }
}
