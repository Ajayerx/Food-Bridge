using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Admin.Commands.DeleteBanner;

public class DeleteBannerCommandHandler : IRequestHandler<DeleteBannerCommand, Unit>
{
    private readonly IAppDbContext _db;
    public DeleteBannerCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(DeleteBannerCommand request, CancellationToken ct)
    {
        var banner = await _db.Banners
            .FirstOrDefaultAsync(b => b.Id == request.BannerId, ct)
            ?? throw new NotFoundException($"Banner {request.BannerId} not found.");

        _db.Banners.Remove(banner);
        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
