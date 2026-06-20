namespace FoodBridge.Application.DTOs.Admin;

public class VendorListResult
{
    public List<AdminVendorDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
}
