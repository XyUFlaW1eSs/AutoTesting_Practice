using AutoTest_Practice_Platform.API.Models;

namespace AutoTest_Practice_Platform.API.Contracts;

public sealed record RegisterRequest(string UserName, string Email, string Password);
public sealed record LoginRequest(string Identity, string Password);
public sealed record AuthResponse(Guid UserId, string UserName, string Email, string Role, string Token, string RefreshToken, DateTimeOffset ExpiresAt);
public sealed record RefreshTokenRequest(Guid UserId, string RefreshToken);
public sealed record UserResponse(Guid Id, string UserName, string Email, string Role, DateTimeOffset CreatedAt, DateTimeOffset? LastLoginAt)
{
    public static UserResponse From(User user) => new(user.Id, user.UserName, user.Email, user.Role, user.CreatedAt, user.LastLoginAt);
}
