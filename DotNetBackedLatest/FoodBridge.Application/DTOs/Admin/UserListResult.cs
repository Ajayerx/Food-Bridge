namespace FoodBridge.Application.DTOs.Admin;

public class UserListResult
{
    public List<AdminUserDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
}
