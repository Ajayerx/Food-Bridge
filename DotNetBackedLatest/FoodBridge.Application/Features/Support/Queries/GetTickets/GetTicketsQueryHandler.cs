// GetTicketsQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Support;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Support.Queries.GetTickets;

public class GetTicketsQueryHandler
    : IRequestHandler<GetTicketsQuery, List<SupportTicketDto>>
{
    private readonly IAppDbContext _db;

    public GetTicketsQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<SupportTicketDto>> Handle(
        GetTicketsQuery request,
        CancellationToken ct)
    {
        var query = _db.SupportTickets
            .AsNoTracking()
            .Include(t => t.User)
            .AsQueryable();

        // Non-admins only see their own tickets
        if (request.RoleType != "Admin")
            query = query.Where(
                t => t.UserId == request.UserId);

        // Filter by status
        if (!string.IsNullOrEmpty(request.Status)
         && Enum.TryParse<TicketStatus>(
                request.Status, out var status))
            query = query.Where(t => t.Status == status);

        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return tickets.Select(t => new SupportTicketDto
        {
            Id = t.Id,
            UserId = t.UserId,
            UserName = t.User.FullName ?? string.Empty,
            UserMobile = t.User.MobileNumber,
            OrderId = t.OrderId,
            Subject = t.Subject,
            Status = t.Status.ToString(),
            CreatedAt = t.CreatedAt,
            ResolvedAt = t.ResolvedAt
        }).ToList();
    }
}