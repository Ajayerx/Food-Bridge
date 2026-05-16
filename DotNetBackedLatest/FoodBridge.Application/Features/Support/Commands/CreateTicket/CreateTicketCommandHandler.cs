// CreateTicketCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Support;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Support.Commands.CreateTicket;

public class CreateTicketCommandHandler
    : IRequestHandler<CreateTicketCommand, SupportTicketDto>
{
    private readonly IAppDbContext _db;

    public CreateTicketCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<SupportTicketDto> Handle(
        CreateTicketCommand request,
        CancellationToken ct)
    {
        // 1. Verify user exists
        var user = await _db.Users
            .FirstOrDefaultAsync(
                u => u.Id == request.UserId
                  && u.DeletedAt == null, ct)
            ?? throw new NotFoundException("User", request.UserId);

        // 2. Verify order if provided
        if (request.OrderId.HasValue)
        {
            var orderExists = await _db.Orders
                .AnyAsync(o => o.Id == request.OrderId, ct);

            if (!orderExists)
                throw new NotFoundException(
                    "Order", request.OrderId.Value);
        }

        // 3. Create ticket
        var ticket = new SupportTicket
        {
            UserId = request.UserId,
            OrderId = request.OrderId,
            Subject = request.Subject,
            Status = TicketStatus.Open
        };

        _db.SupportTickets.Add(ticket);

        // 4. Add first message
        var message = new TicketMessage
        {
            TicketId = ticket.Id,
            SenderId = request.UserId,
            SenderType = TicketSenderType.Customer,
            Message = request.Message
        };

        _db.TicketMessages.Add(message);
        await _db.SaveChangesAsync(ct);

        return new SupportTicketDto
        {
            Id = ticket.Id,
            UserId = ticket.UserId,
            UserName = user.FullName ?? string.Empty,
            UserMobile = user.MobileNumber,
            OrderId = ticket.OrderId,
            Subject = ticket.Subject,
            Status = ticket.Status.ToString(),
            CreatedAt = ticket.CreatedAt,
            Messages = new List<TicketMessageDto>
            {
                new()
                {
                    Id          = message.Id,
                    SenderId    = message.SenderId,
                    SenderName  = user.FullName ?? string.Empty,
                    SenderType  = message.SenderType.ToString(),
                    Message     = message.Message,
                    CreatedAt   = message.CreatedAt
                }
            }
        };
    }
}