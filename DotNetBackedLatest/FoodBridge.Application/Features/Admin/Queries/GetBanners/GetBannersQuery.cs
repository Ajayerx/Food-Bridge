using FoodBridge.Application.DTOs.Admin;
using MediatR;
namespace FoodBridge.Application.Features.Admin.Queries.GetBanners;

public record GetBannersQuery(bool ActiveOnly = false) : IRequest<List<BannerDto>>;
