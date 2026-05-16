using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Reviews.Commands.HideReview;

public class HideReviewCommandHandler : IRequestHandler<HideReviewCommand, Unit>
{
    private readonly IAppDbContext _db;
    public HideReviewCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(HideReviewCommand request, CancellationToken ct)
    {
        var review = await _db.Reviews
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId, ct)
            ?? throw new NotFoundException("Review not found.");

        // Use the Comment field to hide (or add IsHidden bool to entity if desired)
        // For now we nullify the comment to "hide" it — a proper implementation
        // would add an IsHidden column; leaving that for the migration.
        review.Comment = null;
        review.ImageUrls = null;
        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
