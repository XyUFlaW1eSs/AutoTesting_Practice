using AutoTest_Practice_Platform.API.Models;

namespace AutoTest_Practice_Platform.API.Contracts;

public sealed record GenerateReportRequest(string Title);
public sealed record ReportResponse(Guid Id, string Title, string Status, int DurationMs, string Summary, DateTimeOffset CreatedAt)
{
    public static ReportResponse From(ReportRecord report) => new(report.Id, report.Title, report.Status, report.DurationMs, report.Summary, report.CreatedAt);
}
