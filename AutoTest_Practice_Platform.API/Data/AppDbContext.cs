using AutoTest_Practice_Platform.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AutoTest_Practice_Platform.API.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<ResourceItem> Resources => Set<ResourceItem>();
    public DbSet<FileAsset> Files => Set<FileAsset>();
    public DbSet<ReportRecord> Reports => Set<ReportRecord>();

    public DbSet<CardItem> Cards => Set<CardItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasIndex(x => x.UserName).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(256);
            entity.Property(x => x.UserName).HasMaxLength(100);
            entity.Property(x => x.Role).HasMaxLength(50);
        });

        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(50);
            entity.Property(x => x.Priority).HasConversion<string>().HasMaxLength(50);
        });

        modelBuilder.Entity<ResourceItem>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Type).HasMaxLength(100);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(50);
        });

        modelBuilder.Entity<FileAsset>(entity =>
        {
            entity.Property(x => x.OriginalFileName).HasMaxLength(260);
            entity.Property(x => x.StoredFileName).HasMaxLength(260);
            entity.Property(x => x.ContentType).HasMaxLength(120);
            entity.Property(x => x.Category).HasMaxLength(50);
        });

        modelBuilder.Entity<CardItem>(entity =>
        {
            entity.Property(x => x.CardNumber).HasMaxLength(20);
            entity.Property(x => x.ExpiryDate).HasMaxLength(10);
            entity.Property(x => x.Ccv).HasMaxLength(4);
            entity.Property(x => x.IsDeleted).HasDefaultValue(false);
        });
    }
}
