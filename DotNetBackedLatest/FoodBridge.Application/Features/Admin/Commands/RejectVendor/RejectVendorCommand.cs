using MediatR;

namespace FoodBridge.Application.Features.Admin.Commands.RejectVendor;

public record RejectVendorCommand(Guid VendorId, Guid AdminUserId, string? Reason) : IRequest<Unit>;
