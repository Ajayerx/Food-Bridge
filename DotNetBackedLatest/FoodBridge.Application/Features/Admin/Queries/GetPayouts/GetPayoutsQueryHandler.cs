using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Admin;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Admin.Queries.GetPayouts;

public class GetPayoutsQueryHandler : IRequestHandler<GetPayoutsQuery, GetPayoutsResult>
{
    private readonly IAppDbContext _db;
    public GetPayoutsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<GetPayoutsResult> Handle(GetPayoutsQuery request, CancellationToken ct)
    {
        var query = _db.VendorPayouts
            .AsNoTracking()
            .Include(p => p.Vendor)
                .ThenInclude(v => v.User)
            .AsQueryable();

        if (request.VendorId.HasValue)
            query = query.Where(p => p.VendorId == request.VendorId.Value);

        if (!string.IsNullOrWhiteSpace(request.Status) &&
            Enum.TryParse<PayoutStatus>(request.Status, true, out var statusEnum))
            query = query.Where(p => p.Status == statusEnum);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new PayoutDto
            {
                Id = p.Id,
                VendorId = p.VendorId,
                VendorName = p.Vendor.User.FullName,
                Amount = p.Amount,
                Currency = p.Currency,
                Status = p.Status.ToString(),
                TransactionId = p.TransactionId,
                BankAccountNumber = p.BankAccountNumber,
                BankIfscCode = p.BankIfscCode,
                Notes = p.Notes,
                PeriodFrom = p.PeriodFrom,
                PeriodTo = p.PeriodTo,
                ProcessedAt = p.ProcessedAt,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync(ct);

        return new GetPayoutsResult(items, total);
    }
}
