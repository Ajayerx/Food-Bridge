// SalesReportDto.cs
namespace FoodBridge.Application.DTOs.Reports;

public class SalesReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public string GroupBy { get; set; } = string.Empty;
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public decimal AvgOrderValue { get; set; }
    public List<SalesDataPointDto> Data { get; set; } = new();
}

public class SalesDataPointDto
{
    public string Label { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int OrderCount { get; set; }
    public decimal AvgOrderValue { get; set; }
}