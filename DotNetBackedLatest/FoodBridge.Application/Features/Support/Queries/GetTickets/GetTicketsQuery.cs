// GetTicketsQuery.cs
using FoodBridge.Application.DTOs.Support;
using MediatR;
namespace FoodBridge.Application.Features.Support.Queries.GetTickets;

public record GetTicketsQuery(
    Guid UserId,
    string? RoleType,
    string? Status,
    int Page,
    int PageSize)
    : IRequest<List<SupportTicketDto>>;