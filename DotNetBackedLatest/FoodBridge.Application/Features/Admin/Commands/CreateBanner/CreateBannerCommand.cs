using FoodBridge.Application.DTOs.Admin;
using MediatR;
namespace FoodBridge.Application.Features.Admin.Commands.CreateBanner;

public record CreateBannerCommand(
    string Title,
    string? SubTitle,
    string ImageUrl,
    string? LinkUrl,
    string? LinkType,
    bool IsActive,
    int DisplayOrder,
    DateTime? StartsAt,
    DateTime? EndsAt)
    : IRequest<BannerDto>;
