using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace FoodBridge.Infrastructure.Persistence;

/// <summary>
/// Used by EF Core CLI tools (dotnet ef migrations add / update)
/// when running outside of the application host.
/// </summary>
public class AppDbContextFactory
    : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        // ── Load config from API project ─────────────────
        var basePath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "..",
            "FoodBridge.API");

        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json",
                optional: false,
                reloadOnChange: true)
            .AddJsonFile("appsettings.Development.json",
                optional: true,
                reloadOnChange: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration
            .GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' not found.");

        var optionsBuilder =
            new DbContextOptionsBuilder<AppDbContext>();

        optionsBuilder.UseSqlServer(
            connectionString,
            b => b
                .MigrationsAssembly(
                    typeof(AppDbContext).Assembly.FullName)
                .EnableRetryOnFailure(3));

        return new AppDbContext(optionsBuilder.Options);
    }
}