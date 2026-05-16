// UpdateTicketStatusCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Support.Commands.UpdateTicketStatus;

public class UpdateTicketStatusCommandHandler
    : IRequestHandler<UpdateTicketStatusCommand, Unit>
{
    private readonly IAppDbContext _db;

    public UpdateTicketStatusCommandHandler(IAppDbContext db)
        => _db = db;

    public async Task<Unit> Handle(
        UpdateTicketStatusCommand request,
        CancellationToken ct)
    {
        var ticket = await _db.SupportTickets
            .FirstOrDefaultAsync(
                t => t.Id == request.TicketId, ct)
            ?? throw new NotFoundException(
                "Support ticket", request.TicketId);

        var newStatus = Enum.Parse<TicketStatus>(request.Status);

        ticket.Status = newStatus;
        ticket.UpdatedAt = DateTime.UtcNow;

        if (newStatus == TicketStatus.Resolved
         || newStatus == TicketStatus.Closed)
            ticket.ResolvedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Unit.Value;
    }
}