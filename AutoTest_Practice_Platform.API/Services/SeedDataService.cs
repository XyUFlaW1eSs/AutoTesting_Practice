using AutoTest_Practice_Platform.API.Data;
using AutoTest_Practice_Platform.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AutoTest_Practice_Platform.API.Services;

public sealed class SeedDataService(AppDbContext db, IWebHostEnvironment environment)
{
    public async Task SeedAsync()
    {
        await db.Database.MigrateAsync();
        if (await db.Users.AnyAsync())
        {
            return;
        }

        var users = new[]
        {
            new User { UserName = "admin", Email = "admin@example.com", Role = "Admin", PasswordHash = PasswordHasher.Hash("Admin123!") },
            new User { UserName = "tester", Email = "tester@example.com", Role = "Tester", PasswordHash = PasswordHasher.Hash("Tester123!") },
            new User { UserName = "viewer", Email = "viewer@example.com", Role = "Viewer", PasswordHash = PasswordHasher.Hash("Viewer123!") }
        };
        db.Users.AddRange(users);

        var resources = Enumerable.Range(1, 10).Select(index => new ResourceItem
        {
            Name = $"QA Resource {index}",
            Type = index % 3 == 0 ? "Device" : index % 2 == 0 ? "Environment" : "Dataset",
            Url = $"https://example.com/resources/{index}",
            Status = (ResourceStatus)(index % 4),
            Tags = index % 2 == 0 ? "api,ui" : "performance,regression",
            Owner = users[index % users.Length]
        }).ToList();
        db.Resources.AddRange(resources);

        var tasks = Enumerable.Range(1, 20).Select(index => new TaskItem
        {
            Title = $"Automation task {index}",
            Description = $"Practice scenario for API, UI, upload, download and performance checks #{index}.",
            Status = (WorkTaskStatus)(index % 4),
            Priority = (TaskPriority)(index % 4),
            Assignee = users[index % users.Length],
            Resource = resources[index % resources.Count],
            DueDate = DateTimeOffset.UtcNow.AddDays(index - 5)
        }).ToList();
        db.Tasks.AddRange(tasks);

        var uploadRoot = Path.Combine(environment.ContentRootPath, "Uploads");
        Directory.CreateDirectory(uploadRoot);
        var files = Enumerable.Range(1, 10).Select(index =>
        {
            var fileName = $"seed-file-{index}.txt";
            var path = Path.Combine(uploadRoot, fileName);
            if (!File.Exists(path))
            {
                File.WriteAllText(path, $"Seed file {index} for download test training.");
            }

            return new FileAsset
            {
                OriginalFileName = fileName,
                StoredFileName = fileName,
                ContentType = "text/plain",
                Size = new FileInfo(path).Length,
                Category = "file",
                StoragePath = path,
                UploadedBy = users[index % users.Length]
            };
        }).ToList();
        db.Files.AddRange(files);

        db.Reports.AddRange(Enumerable.Range(1, 5).Select(index => new ReportRecord
        {
            Title = $"Regression report {index}",
            Status = "Completed",
            DurationMs = 2000 + index * 400,
            Summary = $"Generated seed report {index}.",
            CreatedBy = users[index % users.Length]
        }));

        await db.SaveChangesAsync();
    }
}
