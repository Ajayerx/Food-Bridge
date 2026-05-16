using MediatR;
namespace FoodBridge.Application.Features.Restaurants.Commands.SubmitForApproval;

public record SubmitForApprovalCommand(Guid RestaurantId, Guid VendorUserId) : IRequest<Unit>;
