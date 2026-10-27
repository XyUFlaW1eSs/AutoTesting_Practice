using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Insurance.Api;

public static class ApplicationStatuses
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Paid = "Paid";
}

public sealed class InsuranceApplication
{
    public long Id { get; set; }
    [MaxLength(100)] public string ApplicantName { get; set; } = "";
    public int Age { get; set; }
    [MaxLength(30)] public string ProductCode { get; set; } = "";
    [Precision(12, 2)] public decimal Premium { get; set; }
    [MaxLength(20)] public string Status { get; set; } = ApplicationStatuses.Pending;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<Payment> Payments { get; set; } = [];
    public Policy? Policy { get; set; }
}

public sealed class Payment
{
    public long Id { get; set; }
    public long ApplicationId { get; set; }
    public InsuranceApplication? Application { get; set; }
    [Precision(12, 2)] public decimal Amount { get; set; }
    [MaxLength(20)] public string Status { get; set; } = "Succeeded";
    [MaxLength(100)] public string IdempotencyKey { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Policy
{
    public long Id { get; set; }
    public long ApplicationId { get; set; }
    public InsuranceApplication? Application { get; set; }
    [MaxLength(40)] public string PolicyNumber { get; set; } = "";
    [MaxLength(20)] public string Status { get; set; } = "Active";
    public DateTimeOffset IssuedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed record CreateApplicationRequest(string ApplicantName, int Age, string ProductCode, decimal Premium);
public sealed record UnderwriteRequest(bool Approve, string? Note);
public sealed record PayRequest(string? IdempotencyKey);
