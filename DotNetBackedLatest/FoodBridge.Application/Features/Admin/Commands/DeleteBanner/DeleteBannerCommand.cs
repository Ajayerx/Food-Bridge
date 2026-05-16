using MediatR;
namespace FoodBridge.Application.Features.Admin.Commands.DeleteBanner;

public record DeleteBannerCommand(Guid BannerId) : IRequest<Unit>;
