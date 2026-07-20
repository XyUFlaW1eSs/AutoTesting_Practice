namespace AutoTest_Practice_Platform.API.Models;

public sealed class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string UserName { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public string Role { get; set; } = "Tester";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLoginAt { get; set; }
    public List<TaskItem> AssignedTasks { get; set; } = [];
    public List<ResourceItem> OwnedResources { get; set; } = [];
    public List<FileAsset> UploadedFiles { get; set; } = [];
}
