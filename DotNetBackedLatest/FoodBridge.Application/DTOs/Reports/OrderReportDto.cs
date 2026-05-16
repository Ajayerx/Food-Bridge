// OrderReportDto.cs
namespace FoodBridge.Application.DTOs.Reports;

public class OrderReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalOrders { get; set; }
    public int DeliveredOrders { get; set; }
    public int CancelledOrders { get; set; }
    public int PendingOrders { get; set; }
    public int RefundedOrders { get; set; }
    public decimal CancellationRate { get; set; }
    public decimal CompletionRate { get; set; }
    public List<OrderStatusBreakdownDto> StatusBreakdown { get; set; } = new();
    public List<OrderDataPointDto> DailyData { get; set; } = new();
}

public class OrderStatusBreakdownDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class OrderDataPointDto
{
    public string Label { get; set; } = string.Empty;
    public int TotalOrders { get; set; }
    public int DeliveredOrders { get; set; }
    public int CancelledOrders { get; set; }
}