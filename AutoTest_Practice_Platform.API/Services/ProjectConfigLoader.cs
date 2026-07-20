using YamlDotNet.Serialization;

namespace AutoTest_Practice_Platform.API.Services;

public sealed record DatabaseConfig(string Username, string Password);

public static class ProjectConfigLoader
{
    public static DatabaseConfig Load(string startDirectory)
    {
        var configPath = FindConfigPath(startDirectory)
                         ?? FindConfigPath(AppContext.BaseDirectory)
                         ?? throw new FileNotFoundException("projectConfig.yaml was not found in the project tree.");
        var deserializer = new DeserializerBuilder()
            .Build();
        var config = deserializer.Deserialize<ProjectConfig>(File.ReadAllText(configPath));

        if (string.IsNullOrWhiteSpace(config.PostgreSQL.Username) || string.IsNullOrWhiteSpace(config.PostgreSQL.Password))
        {
            throw new InvalidOperationException("projectConfig.yaml must contain postgreSQL.Username and postgreSQL.Password.");
        }

        return new DatabaseConfig(config.PostgreSQL.Username, config.PostgreSQL.Password);
    }

    private static string? FindConfigPath(string startDirectory)
    {
        var directory = new DirectoryInfo(startDirectory);
        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, "projectConfig.yaml");
            if (File.Exists(candidate))
            {
                return candidate;
            }
            directory = directory.Parent;
        }

        return null;
    }

    private sealed class ProjectConfig
    {
        [YamlMember(Alias = "postgreSQL")]
        public PostgreSqlConfig PostgreSQL { get; set; } = new();
    }

    private sealed class PostgreSqlConfig
    {
        [YamlMember(Alias = "Username")]
        public string Username { get; set; } = "";
        [YamlMember(Alias = "Password")]
        public string Password { get; set; } = "";
    }
}
