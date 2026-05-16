// RevenueReportDto.cs
namespace FoodBridge.Application.DTOs.Reports;

public class RevenueReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public string GroupBy { get; set; } = string.Empty;
    public decimal GrossRevenue { get; set; }
    public decimal PlatformCommission { get; set; }
    public decimal VendorPayout { get; set; }
    public decimal TaxCollected { get; set; }
    public decimal RefundsIssued { get; set; }
    public decimal NetRevenue { get; set; }
    public List<RevenueDataPointDto> Data { get; set; } = new();
}

public class RevenueDataPointDto
{
    public string Label { get; set; } = string.Empty;
    public decimal GrossRevenue { get; set; }
    public decimal PlatformCommission { get; set; }
    public decimal VendorPayout { get; set; }
    public decimal NetRevenue { get; set; }
}