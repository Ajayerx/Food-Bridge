namespace FoodBridge.Application.DTOs.Reports;

public class VendorOrderReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalOrders { get; set; }
    public int CompletedOrders { get; set; }
    public int CancelledOrders { get; set; }
    public decimal CancellationRate { get; set; }
    public List<OrderStatusBreakdownDto> StatusBreakdown { get; set; } = new();
}

//public class OrderStatusBreakdownDto
//{
//    public string Status { get; set; } = string.Empty;
//    public int Count { get; set; }
//    public decimal Percentage { get; set; }
//}

public class VendorItemReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public List<TopSellingItemDto> TopItems { get; set; } = new();
}

public class TopSellingItemDto
{
    public Guid MenuItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int QuantitySold { get; set; }
    public decimal Revenue { get; set; }
}

public class VendorDailyReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public List<DailyBreakdownDto> Data { get; set; } = new();
}

public class DailyBreakdownDto
{
    public string Date { get; set; } = string.Empty;
    public int OrderCount { get; set; }
    public decimal Revenue { get; set; }
    public decimal AvgOrderValue { get; set; }
}

public class VendorDeliveryReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalDeliveries { get; set; }
    public int OnTimeDeliveries { get; set; }
    public decimal OnTimeRate { get; set; }
    public double AvgDeliveryMinutes { get; set; }
    public List<AgentPerformanceDto> AgentPerformance { get; set; } = new();
}

public class AgentPerformanceDto
{
    public Guid AgentId { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public int Deliveries { get; set; }
    public double AvgMinutes { get; set; }
}
