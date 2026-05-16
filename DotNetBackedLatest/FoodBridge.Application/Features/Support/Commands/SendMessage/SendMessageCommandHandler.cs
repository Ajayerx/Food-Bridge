// SendMessageCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Support;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Support.Commands.SendMessage;

public class SendMessageCommandHandler
    : IRequestHandler<SendMessageCommand, TicketMessageDto>
{
    private readonly IAppDbContext _db;

    public SendMessageCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<TicketMessageDto> Handle(
        SendMessageCommand request,
        CancellationToken ct)
    {
        // 1. Get ticket
        var ticket = await _db.SupportTickets
            .FirstOrDefaultAsync(
                t => t.Id == request.TicketId, ct)
            ?? throw new NotFoundException(
                "Support ticket", request.TicketId);

        if (ticket.Status == TicketStatus.Closed)
            throw new BadRequestException(
                "Cannot send message on a closed ticket.");

        // 2. Get sender info
        var sender = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.Id == request.SenderId, ct)
            ?? throw new NotFoundException(
                "User", request.SenderId);

        // 3. Determine sender type
        var senderType = request.SenderRoleType == "Admin"
            ? TicketSenderType.Support
            : TicketSenderType.Customer;

        // 4. Create message
        var message = new TicketMessage
        {
            TicketId = request.TicketId,
            SenderId = request.SenderId,
            SenderType = senderType,
            Message = request.Message,
            AttachmentUrl = request.AttachmentUrl
        };

        _db.TicketMessages.Add(message);

        // 5. Reopen ticket if it was resolved
        if (ticket.Status == TicketStatus.Resolved
         && senderType == TicketSenderType.Customer)
        {
            ticket.Status = TicketStatus.Open;
            ticket.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        return new TicketMessageDto
        {
            Id = message.Id,
            SenderId = message.SenderId,
            SenderName = sender.FullName ?? string.Empty,
            SenderType = message.SenderType.ToString(),
            Message = message.Message,
            AttachmentUrl = message.AttachmentUrl,
            CreatedAt = message.CreatedAt
        };
    }
}