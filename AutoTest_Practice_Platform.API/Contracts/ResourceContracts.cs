using AutoTest_Practice_Platform.API.Models;

namespace AutoTest_Practice_Platform.API.Contracts;

public sealed record ResourceResponse(Guid Id, string Name, string Type, string? Url, ResourceStatus Status, string Tags, Guid? OwnerId, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt)
{
    public static ResourceResponse From(ResourceItem resource) => new(resource.Id, resource.Name, resource.Type, resource.Url, resource.Status, resource.Tags, resource.OwnerId, resource.CreatedAt, resource.UpdatedAt);
}

public sealed record CreateResourceRequest(string Name, string Type, string? Url, ResourceStatus Status, string Tags, Guid? OwnerId);
public sealed record UpdateResourceRequest(string Name, string Type, string? Url, ResourceStatus Status, string Tags, Guid? OwnerId);
public sealed record PatchResourceRequest(string? Name, string? Type, string? Url, ResourceStatus? Status, string? Tags, Guid? OwnerId);
