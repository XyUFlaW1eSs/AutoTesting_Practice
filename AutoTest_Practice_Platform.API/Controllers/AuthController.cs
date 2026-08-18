using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AutoTest_Practice_Platform.API.Contracts;
using AutoTest_Practice_Platform.API.Data;
using AutoTest_Practice_Platform.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace AutoTest_Practice_Platform.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService auth, AppDbContext db, TokenBlacklist blacklist) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        //如果用户信息为空，返回400错误
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username, email, and password are required." });
        }
        var userResult = await auth.RegisterAsync(request.UserName, request.Email, request.Password);
        if (!userResult.IsSuccess || userResult.Data is null)
        {
            //返回401代码，和错误消息
            return Unauthorized(new { message = userResult.ErrorMessage });
        }
        var loginResult = await auth.LoginAsync(request.Email, request.Password);
        if (!loginResult.IsSuccess) {
            return Unauthorized(new { message = loginResult.ErrorMessage });
        }
        var user = userResult.Data;
        var login = loginResult.Data;
        return Ok(new AuthResponse(user.Id, user.UserName, user.Email, user.Role, login.Token, login.RefreshToken, login.ExpiresAt));
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var loginResult = await auth.LoginAsync(request.Identity, request.Password);
        if (!loginResult.IsSuccess)
        {
            return Unauthorized(new { message = loginResult.ErrorMessage });
        }
        var login = loginResult.Data;
        return Ok(new AuthResponse(login.User.Id, login.User.UserName, login.User.Email, login.User.Role, login.Token, login.RefreshToken, login.ExpiresAt));
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        var token = Request.Headers.Authorization.ToString().Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(token))
        {
            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
            blacklist.Revoke(token, jwt.ValidTo);
        }

        return NoContent();
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshTokenRequest request)
    {
        var user = await db.Users.FindAsync(request.UserId);
        if (user is null || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return Unauthorized(new { message = "Invalid refresh token." });
        }

        var expiresAt = DateTimeOffset.UtcNow.AddHours(2);
        var token = auth.CreateToken(user, expiresAt);
        return Ok(new AuthResponse(user.Id, user.UserName, user.Email, user.Role, token, request.RefreshToken, expiresAt));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> Me()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(id, out var userId))
        {
            return Unauthorized();
        }

        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == userId);
        return user is null ? NotFound() : Ok(UserResponse.From(user));
    }
}