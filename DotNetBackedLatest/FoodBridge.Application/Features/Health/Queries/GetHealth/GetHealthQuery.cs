using FoodBridge.Application.DTOs.Health;
using MediatR;
namespace FoodBridge.Application.Features.Health.Queries.GetHealth;

public record GetHealthQuery : IRequest<HealthDto>;
