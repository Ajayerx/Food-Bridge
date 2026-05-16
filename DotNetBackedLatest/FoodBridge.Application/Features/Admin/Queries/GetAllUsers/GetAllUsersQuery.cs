// GetAllUsersQuery.cs
using FoodBridge.Application.DTOs.Admin;
using MediatR;
namespace FoodBridge.Application.Features.Admin.Queries.GetAllUsers;

public record GetAllUsersQuery(
    string? Role,
    string? Status,
    string? Search,
    int Page,
    int PageSize)
    : IRequest<List<AdminUserDto>>;