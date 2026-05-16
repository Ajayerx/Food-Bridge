using FoodBridge.Application.DTOs.Menu;
using MediatR;
namespace FoodBridge.Application.Features.Menu.Queries.SearchMenuItems;

public record SearchMenuItemsQuery(
    string? Q,
    Guid? RestaurantId,
    string? DietaryTag,
    decimal? MaxPrice,
    int Page,
    int PageSize)
    : IRequest<SearchMenuItemsResult>;

public record SearchMenuItemsResult(List<MenuItemSearchDto> Items, int TotalCount);

public class MenuItemSearchDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public string? ImageUrl { get; set; }
    public string DietaryTag { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public Guid RestaurantId { get; set; }
    public string RestaurantName { get; set; } = string.Empty;
    public string? RestaurantLogoUrl { get; set; }
    public bool IsOpen { get; set; } 
}