using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Net;
using System.Text.Json;

namespace AutoTest_Practice_Platform.API.Middleware;

public sealed class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception caught by middleware");
            await HandleExceptionAsync(context, ex, _env);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception, IWebHostEnvironment env)
    {
        // 展平 AggregateException
        var ex = exception is AggregateException ae && ae.InnerException is not null ? ae.InnerException : exception;

        int status = (int)HttpStatusCode.InternalServerError;
        string title = "An unexpected error occurred.";

        // 常见异常映射到合适的 HTTP 状态码
        if (ex is UnauthorizedAccessException)
        {
            status = StatusCodes.Status401Unauthorized;
            title = "Unauthorized";
        }
        else if (ex is InvalidOperationException)
        {
            status = StatusCodes.Status409Conflict;
            title = "Conflict";
        }
        else if (ex is ArgumentException)
        {
            status = StatusCodes.Status400BadRequest;
            title = "Bad Request";
        }
        else if (ex is Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            // 数据库写入错误，通常是约束/编码等问题
            status = StatusCodes.Status409Conflict;
            title = "Database update error";
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = status;

        var problem = new ProblemDetails
        {
            Title = title,
            Status = status,
            Type = $"https://httpstatuses.com/{status}",
            Instance = context.Request?.Path
        };

        if (env.IsDevelopment())
        {
            // 开发环境：包含异常消息与内层异常信息以便调试
            problem.Detail = ex.Message + (ex.InnerException is not null ? "\n" + ex.InnerException.Message : string.Empty) + "\n" + ex.StackTrace;
        }

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(problem, options);
        await context.Response.WriteAsync(json);
    }
}
