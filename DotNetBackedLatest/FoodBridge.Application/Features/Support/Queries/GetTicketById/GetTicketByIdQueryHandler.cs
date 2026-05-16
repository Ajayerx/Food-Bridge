// GetTicketByIdQueryHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Support;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Support.Queries.GetTicketById;

public class GetTicketByIdQueryHandler
    : IRequestHandler<GetTicketByIdQuery, SupportTicketDto>
{
    private readonly IAppDbContext _db;

    public GetTicketByIdQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<SupportTicketDto> Handle(
        GetTicketByIdQuery request,
        CancellationToken ct)
    {
        // 1. Get ticket with messages
        var ticket = await _db.SupportTickets
            .AsNoTracking()
            .Include(t => t.User)
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(
                t => t.Id == request.TicketId, ct)
            ?? throw new NotFoundException(
                "Support ticket", request.TicketId);

        // 2. Access check
        if (request.RoleType != "Admin"
         && ticket.UserId != request.UserId)
            throw new ForbiddenException(
                "You are not allowed to view this ticket.");

        // 3. Get sender names for all messages
        var senderIds = ticket.Messages
            .Select(m => m.SenderId)
            .Distinct()
            .ToList();

        var senders = await _db.Users
            .AsNoTracking()
            .Where(u => senderIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName ?? string.Empty, ct);

        return new SupportTicketDto
        {
            Id = ticket.Id,
            UserId = ticket.UserId,
            UserName = ticket.User.FullName ?? string.Empty,
            UserMobile = ticket.User.MobileNumber,
            OrderId = ticket.OrderId,
            Subject = ticket.Subject,
            Status = ticket.Status.ToString(),
            CreatedAt = ticket.CreatedAt,
            ResolvedAt = ticket.ResolvedAt,
            Messages = ticket.Messages
                .OrderBy(m => m.CreatedAt)
                .Select(m => new TicketMessageDto
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    SenderName = senders.GetValueOrDefault(
                                        m.SenderId,
                                        string.Empty),
                    SenderType = m.SenderType.ToString(),
                    Message = m.Message,
                    AttachmentUrl = m.AttachmentUrl,
                    CreatedAt = m.CreatedAt
                }).ToList()
        };
    }
}