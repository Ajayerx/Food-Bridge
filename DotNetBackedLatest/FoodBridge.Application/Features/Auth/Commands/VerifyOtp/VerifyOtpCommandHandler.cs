// VerifyOtpCommandHandler.cs
using FoodBridge.Application.Common.Exceptions;
using FoodBridge.Application.Common.Interfaces;
using FoodBridge.Application.DTOs.Auth;
using FoodBridge.Domain.Entities;
using FoodBridge.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace FoodBridge.Application.Features.Auth.Commands.VerifyOtp;

public class VerifyOtpCommandHandler
    : IRequestHandler<VerifyOtpCommand, VerifyOtpResponseDto>
{
    private readonly IAppDbContext _db;
    private readonly IOtpService _otpService;
    private readonly IJwtService _jwtService;

    public VerifyOtpCommandHandler(
        IAppDbContext db,
        IOtpService otpService,
        IJwtService jwtService)
    {
        _db = db;
        _otpService = otpService;
        _jwtService = jwtService;
    }

    public async Task<VerifyOtpResponseDto> Handle(
        VerifyOtpCommand request,
        CancellationToken ct)
    {
        // 1. Validate OTP
        var valid = await _otpService.ValidateOtpAsync(
            request.MobileNumber, request.Otp, ct);

        if (!valid)
            throw new BadRequestException(
                "Invalid or expired OTP.");

        // 2. Find or create user
        var isNewUser = false;
        var mobile = request.MobileNumber?.Trim();
        var user = await _db.Users
            .Include(u => u.StaffUser)
            .FirstOrDefaultAsync(
                u => u.MobileNumber == request.MobileNumber
                  && u.DeletedAt == null, ct);

        if (user is null)
        {
            isNewUser = true;
            user = new User
            {
                MobileNumber = request.MobileNumber!,
                Role = UserRole.Customer,
                Status = UserStatus.Active
            };
            _db.Users.Add(user);

            // Create customer profile
            _db.Customers.Add(new Customer
            {
                UserId = user.Id
            });
        }
        else if (user.Status == UserStatus.Banned)
        {
            throw new ForbiddenException(
                "Your account has been banned. Contact support.");
        }

        // 3. Update last login
        user.LastLoginAt = DateTime.UtcNow;

        // 4. Generate tokens
        var accessToken = _jwtService.GenerateAccessToken(
            user.Id, user.Role.ToString());
        var refreshToken = _jwtService.GenerateRefreshToken();

        // 5. Store refresh token
        _db.RefreshTokens.Add(new  Domain.Entities.RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            DeviceInfo = request.DeviceInfo
        });

        await _db.SaveChangesAsync(ct);

        return new VerifyOtpResponseDto
        {
            UserId = user.Id,
            FullName = user.FullName ?? string.Empty,
            MobileNumber = user.MobileNumber!,
            Role = user.Role.ToString(),
            StaffRole = user.StaffUser != null
                ? user.StaffUser.StaffRole.ToString().ToLower()
                : null,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = 60,
            IsNewUser = isNewUser
        };
    }
}