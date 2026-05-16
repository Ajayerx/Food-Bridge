namespace FoodBridge.Application.DTOs.Menu
{
    public class ItemVariantDto
    {
        public Guid Id { get; set; } 
        public string ItemId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool IsAvailable { get; set; } 

    }
}
