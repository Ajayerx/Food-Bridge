// GetAllUsersQueryHandler.cs
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Admin;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Admin.Queries.GetAllUsers;

public class GetAllUsersQueryHandler
    : IRequestHandler<GetAllUsersQuery, List<AdminUserDto>>
{
    private readonly IAppDbContext _db;

    public GetAllUsersQueryHandler(IAppDbContext db)
        => _db = db;

    public async Task<List<AdminUserDto>> Handle(
        GetAllUsersQuery request,
        CancellationToken ct)
    {
        var query = _db.Users
            .AsNoTracking()
            .Where(u => u.DeletedAt == null);

        // Filter by role
        if (!string.IsNullOrEmpty(request.Role)
         && Enum.TryParse<UserRole>(request.Role, out var role))
            query = query.Where(u => u.Role == role);

        // Filter by status
        if (!string.IsNullOrEmpty(request.Status)
         && Enum.TryParse<UserStatus>(request.Status, out var status))
            query = query.Where(u => u.Status == status);

        // Search by name or mobile
        if (!string.IsNullOrEmpty(request.Search))
            query = query.Where(u =>
                (u.FullName != null &&
                 u.FullName.Contains(request.Search))
             || u.MobileNumber.Contains(request.Search)
             || (u.Email != null &&
                 u.Email.Contains(request.Search)));

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        return users.Select(u => new AdminUserDto
        {
            Id = u.Id,
            FullName = u.FullName ?? string.Empty,
            MobileNumber = u.MobileNumber,
            Email = u.Email,
            AvatarUrl = u.AvatarUrl,
            Role = u.Role.ToString(),
            Status = u.Status.ToString(),
            CreatedAt = u.CreatedAt,
            LastLoginAt = u.LastLoginAt
        }).ToList();
    }
}