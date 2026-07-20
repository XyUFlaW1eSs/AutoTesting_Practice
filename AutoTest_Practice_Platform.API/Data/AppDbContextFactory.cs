using AutoTest_Practice_Platform.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AutoTest_Practice_Platform.API.Data;

public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var contentRoot = Directory.GetCurrentDirectory();
        var config = ProjectConfigLoader.Load(contentRoot);
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql($"Host=127.0.0.1;Port=5432;Database=autotest_platform;Username={config.Username};Password={config.Password};Client Encoding=UTF8;")
            .Options;

        return new AppDbContext(options);
    }
}
