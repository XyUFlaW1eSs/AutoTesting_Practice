using System.Collections.Concurrent;

namespace AutoTest_Practice_Platform.API.Services;

public sealed class TokenBlacklist
{
    private readonly ConcurrentDictionary<string, DateTimeOffset> _tokens = new();

    public void Revoke(string token, DateTimeOffset expiresAt) => _tokens[token] = expiresAt;

    public bool IsRevoked(string token)
    {
        foreach (var item in _tokens.Where(item => item.Value <= DateTimeOffset.UtcNow))
        {
            _tokens.TryRemove(item.Key, out _);
        }

        return _tokens.ContainsKey(token);
    }
}
