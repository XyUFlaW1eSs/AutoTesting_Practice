namespace AutoTest_Practice_Platform.API.Models;

public enum ResourceStatus
{
    Available,
    Busy,
    Maintenance,
    Offline
}

public sealed class ResourceItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public string Type { get; set; } = "Environment";
    public string? Url { get; set; }
    public ResourceStatus Status { get; set; } = ResourceStatus.Available;
    public string Tags { get; set; } = "";
    public Guid? OwnerId { get; set; }
    public User? Owner { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<TaskItem> Tasks { get; set; } = [];
}
