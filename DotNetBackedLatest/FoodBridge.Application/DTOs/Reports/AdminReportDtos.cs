namespace FoodBridge.Application.DTOs.Reports;

public class AdminPlatformReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalGmv { get; set; }
    public decimal PlatformRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int NewUsers { get; set; }
    public int NewVendors { get; set; }
    public int ActiveRestaurants { get; set; }
    public int TotalUsers { get; set; }
    public int TotalRestaurants { get; set; }
    public List<SalesDataPointDto> GmvChart { get; set; } = new();
    public List<SalesDataPointDto> RevenueByRestaurant { get; set; } = new();
    public List<PayoutSummaryDto> PayoutSummary { get; set; } = new();
}

public class AdminVendorsReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalCount { get; set; }
    public List<VendorPerformanceDto> Vendors { get; set; } = new();
}

public class VendorPerformanceDto
{
    public Guid VendorId { get; set; }
    public string VendorName { get; set; } = string.Empty;
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal Commission { get; set; }
    public int ActiveRestaurants { get; set; }
    public decimal AvgRating { get; set; }
}

public class AdminFinancialsReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public decimal TotalGmv { get; set; }
    public decimal TotalCommission { get; set; }
    public decimal TotalPayouts { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal TotalRefunds { get; set; }
    public List<FinancialDataPointDto> Data { get; set; } = new();
}

public class FinancialDataPointDto
{
    public string Label { get; set; } = string.Empty;
    public decimal Gmv { get; set; }
    public decimal Commission { get; set; }
    public decimal Payouts { get; set; }
    public decimal Refunds { get; set; }
}

public class PayoutSummaryDto
{
    public Guid RestaurantId { get; set; }
    public string RestaurantName { get; set; } = string.Empty;
    public decimal GrossRevenue { get; set; }
    public decimal PlatformFee { get; set; }
    public decimal NetPayout { get; set; }
}
