// GetTicketByIdQuery.cs
using FoodBridge.Application.DTOs.Support;
using MediatR;
namespace FoodBridge.Application.Features.Support.Queries.GetTicketById;

public record GetTicketByIdQuery(
    Guid TicketId,
    Guid UserId,
    string? RoleType)
    : IRequest<SupportTicketDto>;