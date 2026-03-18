using System.Net;
using System.Net.Http.Headers;
using Xunit;

namespace ArenaOps.CoreService.Tests;

public class CoreIntegrationTests : IClassFixture<CoreWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CoreWebApplicationFactory _factory;

    public CoreIntegrationTests(CoreWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ── Health check ──────────────────────────────────────────────────────

    [Fact]
    public async Task HealthCheck_Returns200()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Stadiums (unauthenticated) ─────────────────────────────────────────

    [Fact]
    public async Task GetStadiums_NoToken_Returns401()
    {
        var response = await _client.GetAsync("/api/stadiums");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Stadiums (authenticated) ───────────────────────────────────────────

    [Fact]
    public async Task GetStadiums_WithValidToken_Returns200()
    {
        var jwt = _factory.GenerateTestJwt(Guid.NewGuid(), role: "Admin");

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/stadiums");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Ping (anonymous) ──────────────────────────────────────────────────

    [Fact]
    public async Task StadiumPing_Returns200()
    {
        var response = await _client.GetAsync("/api/stadiums/ping");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
