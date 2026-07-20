namespace AutoTest_Practice_Platform.API.Models;

public sealed class FileAsset
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string OriginalFileName { get; set; }
    public required string StoredFileName { get; set; }
    public required string ContentType { get; set; }
    public long Size { get; set; }
    public string Category { get; set; } = "file";
    public required string StoragePath { get; set; }
    public Guid? UploadedById { get; set; }
    public User? UploadedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
