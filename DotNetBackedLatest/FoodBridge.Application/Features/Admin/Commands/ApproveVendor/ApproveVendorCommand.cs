using MediatR;

namespace FoodBridge.Application.Features.Admin.Commands.ApproveVendor;

public record ApproveVendorCommand(Guid VendorId, Guid AdminUserId) : IRequest<Unit>;
