using AutoTest_Practice_Platform.API.Data;
using AutoTest_Practice_Platform.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AutoTest_Practice_Platform.API.Services;

public sealed class AuthService(AppDbContext db, IConfiguration configuration)
{
    public async Task<Result<User>> RegisterAsync(string userName, string email, string password)
    {
        if (await db.Users.AnyAsync(x => x.Email == email || x.UserName == userName))
        {

            return Result<User>.Failure("User name or email already exists.");
        }

        var user = new User
        {
            UserName = userName,
            Email = email,
            PasswordHash = PasswordHasher.Hash(password),
            Role = "Tester"
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return Result<User>.Success(user);
    }

    public async Task<Result<(User User, string Token, string RefreshToken, DateTimeOffset ExpiresAt)>> LoginAsync(string identity, string password)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Email == identity || x.UserName == identity);
        if(user == null)
        {
            return Result<(User User, string Token, string RefreshToken, DateTimeOffset ExpiresAt)>.Failure("Invalid credentials.");
        }
        if (!PasswordHasher.Verify(password, user.PasswordHash))
        {
            return Result<(User User, string Token, string RefreshToken, DateTimeOffset ExpiresAt)>.Failure("Invalid credentials.");
        }

        user.LastLoginAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        var expiresAt = DateTimeOffset.UtcNow.AddHours(2);
        var token = CreateToken(user, expiresAt);
        var refreshToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        return Result<(User User, string Token, string RefreshToken, DateTimeOffset ExpiresAt)>.Success((user, token, refreshToken, expiresAt));
    }

    public string CreateToken(User user, DateTimeOffset expiresAt)
    {
        var key = configuration["Jwt:Key"] ?? "local-development-secret-key-change-before-production-2026";
        var issuer = configuration["Jwt:Issuer"] ?? "AutoTestPracticePlatform";
        var audience = configuration["Jwt:Audience"] ?? "AutoTestPracticePlatform.Client";
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Role, user.Role)
            };

        var token = new JwtSecurityToken(issuer, audience, claims, DateTime.UtcNow, expiresAt.UtcDateTime, credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
