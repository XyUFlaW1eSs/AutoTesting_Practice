namespace AutoTest_Practice_Platform.API.Models;

public enum WorkTaskStatus
{
    Todo,
    InProgress,
    Blocked,
    Done
}

public enum TaskPriority
{
    Low,
    Medium,
    High,
    Critical
}

public sealed class TaskItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Title { get; set; }
    public string? Description { get; set; }
    public WorkTaskStatus Status { get; set; } = WorkTaskStatus.Todo;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public Guid? AssigneeId { get; set; }
    public User? Assignee { get; set; }
    public Guid? ResourceId { get; set; }
    public ResourceItem? Resource { get; set; }
    public DateTimeOffset? DueDate { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
