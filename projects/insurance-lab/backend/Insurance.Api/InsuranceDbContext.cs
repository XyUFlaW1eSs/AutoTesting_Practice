using Microsoft.EntityFrameworkCore;

namespace Insurance.Api;

public sealed class InsuranceDbContext(DbContextOptions<InsuranceDbContext> options) : DbContext(options)
{
    public DbSet<InsuranceApplication> Applications => Set<InsuranceApplication>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Policy> Policies => Set<Policy>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InsuranceApplication>(e =>
        {
            e.ToTable("applications", t =>
            {
                t.HasCheckConstraint("ck_applications_age", "\"Age\" BETWEEN 18 AND 60");
                t.HasCheckConstraint("ck_applications_premium", "\"Premium\" > 0");
            });
            e.HasIndex(x => new { x.Status, x.CreatedAt });
            e.Property(x => x.Premium).HasPrecision(12, 2);
        });
        modelBuilder.Entity<Payment>(e =>
        {
            e.ToTable("payments", t => t.HasCheckConstraint("ck_payments_amount", "\"Amount\" > 0"));
            e.HasIndex(x => x.IdempotencyKey).IsUnique();
            e.Property(x => x.Amount).HasPrecision(12, 2);
            e.HasOne(x => x.Application).WithMany(x => x.Payments).HasForeignKey(x => x.ApplicationId);
        });
        modelBuilder.Entity<Policy>(e =>
        {
            e.ToTable("policies");
            e.HasIndex(x => x.ApplicationId).IsUnique();
            e.HasIndex(x => x.PolicyNumber).IsUnique();
            e.HasOne(x => x.Application).WithOne(x => x.Policy).HasForeignKey<Policy>(x => x.ApplicationId);
        });
    }
}
