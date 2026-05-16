using FoodBridge.Application.DTOs.VendorRegistration;
using MediatR;
namespace FoodBridge.Application.Features.VendorRegistration.Commands.RegisterVendor;

public record RegisterVendorCommand(
    string MobileNumber,
    string FullName,
    string? Email,
    string BusinessName,
    string? GstNumber,
    string? PanNumber,
    string? BankAccountNumber,
    string? BankIfscCode,
    string? BankHolderName)
    : IRequest<VendorRegisterResponseDto>;
