// ApiError.cs
namespace FoodBridge.Application.DTOs.Common;

public class ApiError
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}