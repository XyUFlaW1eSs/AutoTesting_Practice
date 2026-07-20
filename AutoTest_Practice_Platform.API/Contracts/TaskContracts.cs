using AutoTest_Practice_Platform.API.Models;

namespace AutoTest_Practice_Platform.API.Contracts;

public sealed record TaskResponse(Guid Id, string Title, string? Description, WorkTaskStatus Status, TaskPriority Priority, Guid? AssigneeId, Guid? ResourceId, DateTimeOffset? DueDate, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt)
{
    public static TaskResponse From(TaskItem task) => new(task.Id, task.Title, task.Description, task.Status, task.Priority, task.AssigneeId, task.ResourceId, task.DueDate, task.CreatedAt, task.UpdatedAt);
}

public sealed record CreateTaskRequest(string Title, string? Description, WorkTaskStatus Status, TaskPriority Priority, Guid? AssigneeId, Guid? ResourceId, DateTimeOffset? DueDate);
public sealed record UpdateTaskRequest(string Title, string? Description, WorkTaskStatus Status, TaskPriority Priority, Guid? AssigneeId, Guid? ResourceId, DateTimeOffset? DueDate);
public sealed record PatchTaskRequest(string? Title, string? Description, WorkTaskStatus? Status, TaskPriority? Priority, Guid? AssigneeId, Guid? ResourceId, DateTimeOffset? DueDate);
