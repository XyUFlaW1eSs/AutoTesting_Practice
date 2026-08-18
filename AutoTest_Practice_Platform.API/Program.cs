using System.Text;
using AutoTest_Practice_Platform.API.Data;
using AutoTest_Practice_Platform.API.Middleware;
using AutoTest_Practice_Platform.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var databaseConfig = ProjectConfigLoader.Load(builder.Environment.ContentRootPath);
var databaseName = builder.Configuration.GetValue("DatabaseName", "autotest_platform");
var connectionString = $"Host=127.0.0.1;Port=5432;Database={databaseName};Username={databaseConfig.Username};Password={databaseConfig.Password};Client Encoding=UTF8;";

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<SeedDataService>();
builder.Services.AddSingleton<TokenBlacklist>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "local-development-secret-key-change-before-production-2026";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "AutoTestPracticePlatform",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "AutoTestPracticePlatform.Client",
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("login", limiter =>
    {
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.PermitLimit = 5;
        limiter.QueueLimit = 0;
    });
});

builder.Services.AddCors(options =>
{
    //options.AddPolicy("client", policy =>
    //{
    //    policy.AllowAnyHeader()
    //        .AllowAnyMethod()
    //        .AllowCredentials()
    //        .SetIsOriginAllowed(origin => origin.StartsWith("http://localhost", StringComparison.OrdinalIgnoreCase)
    //                                      || origin.StartsWith("http://127.0.0.1", StringComparison.OrdinalIgnoreCase)
    //                                      || origin.StartsWith("tauri://", StringComparison.OrdinalIgnoreCase));
    //});

    options.AddPolicy("client", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .SetIsOriginAllowed(_ => true); // 动态允许所有 Origin，且兼容 Credentials
    });
});

var app = builder.Build();

// 全局异常处理中间件，捕获未处理异常并返回标准化 ProblemDetails 响应
app.UseMiddleware<ExceptionMiddleware>();

using (var scope = app.Services.CreateScope())
{
    var seedData = scope.ServiceProvider.GetRequiredService<SeedDataService>();
    await seedData.SeedAsync();
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("client");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();
