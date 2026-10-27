using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("InsuranceDb");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Missing ConnectionStrings:InsuranceDb. Configure it with user-secrets or environment variables.");

builder.Services.AddDbContext<InsuranceDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options => options.AddPolicy("frontend", policy =>
    policy.WithOrigins(builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173")
          .AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors("frontend");
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "insurance-api" })).WithTags("Health");

app.MapGet("/api/applications", async (InsuranceDbContext db, CancellationToken ct) =>
    Results.Ok(await db.Applications.AsNoTracking().OrderByDescending(x => x.CreatedAt)
        .Select(x => new { x.Id, x.ApplicantName, x.Age, x.ProductCode, x.Premium, x.Status, x.CreatedAt })
        .ToListAsync(ct))).WithTags("Applications");

app.MapPost("/api/applications", async (CreateApplicationRequest request, InsuranceDbContext db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(request.ApplicantName) || request.ApplicantName.Trim().Length > 100)
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["applicantName"] = ["姓名必填且不超过 100 个字符。"] });
    if (request.Age is < 18 or > 60)
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["age"] = ["教学规则：年龄必须在 18 至 60 岁之间（含边界）。"] });
    if (string.IsNullOrWhiteSpace(request.ProductCode))
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["productCode"] = ["产品代码必填。"] });
    if (request.Premium <= 0 || decimal.Round(request.Premium, 2) != request.Premium)
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["premium"] = ["保费必须大于 0 且最多两位小数。"] });

    var item = new InsuranceApplication
    {
        ApplicantName = request.ApplicantName.Trim(),
        Age = request.Age,
        ProductCode = request.ProductCode.Trim().ToUpperInvariant(),
        Premium = request.Premium,
        Status = ApplicationStatuses.Pending
    };
    db.Applications.Add(item);
    await db.SaveChangesAsync(ct);
    return Results.Created($"/api/applications/{item.Id}", new { item.Id, item.ApplicantName, item.Age, item.ProductCode, item.Premium, item.Status });
}).WithTags("Applications");

app.MapPost("/api/applications/{id:long}/underwrite", async (long id, UnderwriteRequest request, InsuranceDbContext db, CancellationToken ct) =>
{
    var item = await db.Applications.SingleOrDefaultAsync(x => x.Id == id, ct);
    if (item is null) return Results.NotFound(new { message = "申请不存在。" });
    if (item.Status != ApplicationStatuses.Pending)
        return Results.Conflict(new { message = $"当前状态 {item.Status} 不允许核保。" });
    item.Status = request.Approve ? ApplicationStatuses.Approved : ApplicationStatuses.Rejected;
    item.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { item.Id, item.Status, note = request.Note });
}).WithTags("Underwriting");

app.MapPost("/api/applications/{id:long}/pay", async (long id, PayRequest request, InsuranceDbContext db, CancellationToken ct) =>
{
    await using var tx = await db.Database.BeginTransactionAsync(ct);
    var item = await db.Applications.SingleOrDefaultAsync(x => x.Id == id, ct);
    if (item is null) return Results.NotFound(new { message = "申请不存在。" });
    var key = string.IsNullOrWhiteSpace(request.IdempotencyKey) ? $"application-{id}-payment" : request.IdempotencyKey.Trim();
    var existing = await db.Payments.SingleOrDefaultAsync(x => x.IdempotencyKey == key, ct);
    if (existing is not null)
    {
        if (existing.ApplicationId != id) return Results.Conflict(new { message = "幂等键已用于其他申请。" });
        var existingPolicy = await db.Policies.SingleOrDefaultAsync(x => x.ApplicationId == id, ct);
        return Results.Ok(new { applicationId = id, paymentId = existing.Id, paymentStatus = existing.Status, policyNumber = existingPolicy?.PolicyNumber, policyStatus = existingPolicy?.Status, duplicate = true });
    }
    if (item.Status != ApplicationStatuses.Approved)
        return Results.Conflict(new { message = "只有核保通过的申请才能支付。" });
    if (await db.Policies.AnyAsync(x => x.ApplicationId == id, ct))
        return Results.Conflict(new { message = "该申请已生成保单。" });

    var payment = new Payment { ApplicationId = id, Amount = item.Premium, Status = "Succeeded", IdempotencyKey = key };
    var policy = new Policy { ApplicationId = id, PolicyNumber = $"LAB-{id:D8}", Status = "Active" };
    item.Status = ApplicationStatuses.Paid;
    item.UpdatedAt = DateTimeOffset.UtcNow;
    db.Payments.Add(payment);
    db.Policies.Add(policy);
    await db.SaveChangesAsync(ct);
    await tx.CommitAsync(ct);
    return Results.Ok(new { applicationId = id, paymentId = payment.Id, paymentStatus = payment.Status, policyNumber = policy.PolicyNumber, policyStatus = policy.Status, duplicate = false });
}).WithTags("Payments");

app.MapGet("/api/policies", async (InsuranceDbContext db, CancellationToken ct) =>
    Results.Ok(await db.Policies.AsNoTracking().OrderByDescending(x => x.IssuedAt)
        .Select(x => new { x.Id, x.ApplicationId, x.PolicyNumber, x.Status, x.IssuedAt, ApplicantName = x.Application!.ApplicantName, x.Application!.Premium })
        .ToListAsync(ct))).WithTags("Policies");

app.MapGet("/api/policies/{id:long}", async (long id, InsuranceDbContext db, CancellationToken ct) =>
{
    var policy = await db.Policies.AsNoTracking()
        .Where(x => x.Id == id)
        .Select(x => new { x.Id, x.ApplicationId, x.PolicyNumber, x.Status, x.IssuedAt, ApplicantName = x.Application!.ApplicantName, x.Application!.Premium })
        .SingleOrDefaultAsync(ct);
    return policy is null ? Results.NotFound(new { message = "保单不存在。" }) : Results.Ok(policy);
}).WithTags("Policies");

app.Run();

public partial class Program { }
