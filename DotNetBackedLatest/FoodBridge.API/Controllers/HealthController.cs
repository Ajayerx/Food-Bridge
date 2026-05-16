using FoodBridge.Application.Features.Health.Queries.GetHealth;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FoodBridge.API.Controllers;

[ApiController]
[Route("v1")]
public class HealthController : ControllerBase
{
    private readonly IMediator _mediator;

    public HealthController(IMediator mediator)
        => _mediator = mediator;

    /// <summary>GET v1/health — Public health check</summary>
    [HttpGet("health")]
    public async Task<IActionResult> GetHealth(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetHealthQuery(), ct);
        return result.Status == "ok"
            ? Ok(new { success = true, data = result })
            : StatusCode(503, new { success = false, data = result });
    }
}
