using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ArenaOps.AuthService.Core.DTOs;
using ArenaOps.Shared.Models;
using Xunit;

namespace ArenaOps.AuthService.Tests;

public class AuthIntegrationTests : IClassFixture<AuthWebApplicationFactory>
{
    private readonly HttpClient _client;

    // Unique email suffix per test run to avoid conflicts if DB wasn't cleaned up
    private static readonly string _runId = Guid.NewGuid().ToString("N")[..8];

    public AuthIntegrationTests(AuthWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ── Health check ──────────────────────────────────────────────────────

    [Fact]
    public async Task HealthCheck_Returns200()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Register ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_ValidRequest_Returns200WithToken()
    {
        var request = new RegisterRequest
        {
            Email = $"test_{_runId}_register@arenaops.test",
            Password = "TestPass123!",
            FullName = "Test User"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await DeserializeAsync<ApiResponse<AuthResponse>>(response);
        Assert.True(body?.Success);
        Assert.False(string.IsNullOrEmpty(body?.Data?.AccessToken));
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        var email = $"test_{_runId}_dup@arenaops.test";
        var request = new RegisterRequest
        {
            Email = email,
            Password = "TestPass123!",
            FullName = "Duplicate User"
        };

        await _client.PostAsJsonAsync("/api/auth/register", request);
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    // ── Login ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_AfterRegister_Returns200WithToken()
    {
        var email = $"test_{_runId}_login@arenaops.test";

        await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = "TestPass123!",
            FullName = "Login Test User"
        });

        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = email,
            Password = "TestPass123!"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await DeserializeAsync<ApiResponse<AuthResponse>>(response);
        Assert.True(body?.Success);
        Assert.False(string.IsNullOrEmpty(body?.Data?.AccessToken));
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var email = $"test_{_runId}_wrongpw@arenaops.test";

        await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = "TestPass123!",
            FullName = "Wrong Password Test"
        });

        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = email,
            Password = "WrongPassword!"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_UnknownEmail_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = "nobody@does.not.exist",
            Password = "AnyPassword123!"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private static async Task<T?> DeserializeAsync<T>(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }
}
