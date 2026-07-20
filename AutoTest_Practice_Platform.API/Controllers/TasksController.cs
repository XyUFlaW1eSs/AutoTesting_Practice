using AutoTest_Practice_Platform.API.Contracts;
using AutoTest_Practice_Platform.API.Data;
using AutoTest_Practice_Platform.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoTest_Practice_Platform.API.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public sealed class TasksController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<object>> GetAll([FromQuery] WorkTaskStatus? status, [FromQuery] TaskPriority? priority, [FromQuery] string? keyword, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = db.Tasks.AsNoTracking().AsQueryable();
        if (status.HasValue) query = query.Where(x => x.Status == status);
        if (priority.HasValue) query = query.Where(x => x.Priority == priority);
        if (!string.IsNullOrWhiteSpace(keyword)) query = query.Where(x => x.Title.Contains(keyword) || (x.Description != null && x.Description.Contains(keyword)));
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(x => x.CreatedAt)
            .ThenBy(x => x.Title)
            .Skip((Math.Max(page, 1) - 1) * Math.Clamp(pageSize, 1, 100))
            .Take(Math.Clamp(pageSize, 1, 100))
            .Select(x => TaskResponse.From(x))
            .ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TaskResponse>> GetById(Guid id)
    {
        var task = await db.Tasks.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return task is null ? NotFound() : Ok(TaskResponse.From(task));
    }

    [HttpPost]
    public async Task<ActionResult<TaskResponse>> Create(CreateTaskRequest request)
    {
        var task = new TaskItem
        {
            Title = request.Title,
            Description = request.Description,
            Status = request.Status,
            Priority = request.Priority,
            AssigneeId = request.AssigneeId,
            ResourceId = request.ResourceId,
            DueDate = request.DueDate
        };
        db.Tasks.Add(task);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = task.Id }, TaskResponse.From(task));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TaskResponse>> Update(Guid id, UpdateTaskRequest request)
    {
        var task = await db.Tasks.FindAsync(id);
        if (task is null) return NotFound();
        task.Title = request.Title;
        task.Description = request.Description;
        task.Status = request.Status;
        task.Priority = request.Priority;
        task.AssigneeId = request.AssigneeId;
        task.ResourceId = request.ResourceId;
        task.DueDate = request.DueDate;
        task.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Ok(TaskResponse.From(task));
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<TaskResponse>> Patch(Guid id, PatchTaskRequest request)
    {
        var task = await db.Tasks.FindAsync(id);
        if (task is null) return NotFound();
        task.Title = request.Title ?? task.Title;
        task.Description = request.Description ?? task.Description;
        task.Status = request.Status ?? task.Status;
        task.Priority = request.Priority ?? task.Priority;
        task.AssigneeId = request.AssigneeId ?? task.AssigneeId;
        task.ResourceId = request.ResourceId ?? task.ResourceId;
        task.DueDate = request.DueDate ?? task.DueDate;
        task.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Ok(TaskResponse.From(task));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var task = await db.Tasks.FindAsync(id);
        if (task is null) return NotFound();
        db.Tasks.Remove(task);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("flaky")]
    [AllowAnonymous]
    public IActionResult Flaky()
    {
        if (Random.Shared.NextDouble() < 0.2)
        {
            return StatusCode(500, new { message = "Synthetic flaky failure for retry training.", probability = 0.2 });
        }

        return Ok(new { message = "Flaky endpoint succeeded.", timestamp = DateTimeOffset.UtcNow });
    }
}
