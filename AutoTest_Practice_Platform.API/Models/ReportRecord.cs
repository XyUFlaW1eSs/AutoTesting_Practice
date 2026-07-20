namespace AutoTest_Practice_Platform.API.Models;

public sealed class ReportRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Title { get; set; }
    public string Status { get; set; } = "Completed";
    public int DurationMs { get; set; }
    public string Summary { get; set; } = "";
    public Guid? CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
