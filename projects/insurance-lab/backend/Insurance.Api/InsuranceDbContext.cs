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
            e.ToTable("applications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ApplicantName).HasColumnName("applicant_name").HasMaxLength(100).IsRequired();
            e.Property(x => x.Age).HasColumnName("age");
            e.Property(x => x.ProductCode).HasColumnName("product_code").HasMaxLength(30).IsRequired();
            e.Property(x => x.Premium).HasColumnName("premium").HasPrecision(12, 2);
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasIndex(x => new { x.Status, x.CreatedAt }).HasDatabaseName("ix_applications_status_created");
            e.HasCheckConstraint("ck_applications_age", "age BETWEEN 18 AND 60");
            e.HasCheckConstraint("ck_applications_premium", "premium > 0");
        });
        modelBuilder.Entity<Payment>(e =>
        {
            e.ToTable("payments");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ApplicationId).HasColumnName("application_id");
            e.Property(x => x.Amount).HasColumnName("amount").HasPrecision(12, 2);
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            e.Property(x => x.IdempotencyKey).HasColumnName("idempotency_key").HasMaxLength(100);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.HasIndex(x => x.IdempotencyKey).IsUnique().HasDatabaseName("payments_idempotency_key_key");
            e.HasIndex(x => x.ApplicationId).HasDatabaseName("ix_payments_application");
            e.HasCheckConstraint("ck_payments_amount", "amount > 0");
            e.HasOne(x => x.Application).WithMany(x => x.Payments).HasForeignKey(x => x.ApplicationId);
        });
        modelBuilder.Entity<Policy>(e =>
        {
            e.ToTable("policies");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ApplicationId).HasColumnName("application_id");
            e.Property(x => x.PolicyNumber).HasColumnName("policy_number").HasMaxLength(40);
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            e.Property(x => x.IssuedAt).HasColumnName("issued_at");
            e.HasIndex(x => x.ApplicationId).IsUnique().HasDatabaseName("policies_application_id_key");
            e.HasIndex(x => x.PolicyNumber).IsUnique().HasDatabaseName("policies_policy_number_key");
            e.HasCheckConstraint("ck_policies_status", "status IN ('Active','Cancelled')");
            e.HasOne(x => x.Application).WithOne(x => x.Policy).HasForeignKey<Policy>(x => x.ApplicationId);
        });
    }
}