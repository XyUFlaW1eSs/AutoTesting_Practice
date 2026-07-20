using AutoTest_Practice_Platform.API.Models;

namespace AutoTest_Practice_Platform.API.Contracts;

public sealed record FileAssetResponse(Guid Id, string OriginalFileName, string ContentType, long Size, string Category, DateTimeOffset CreatedAt)
{
    public static FileAssetResponse From(FileAsset file) => new(file.Id, file.OriginalFileName, file.ContentType, file.Size, file.Category, file.CreatedAt);
}
