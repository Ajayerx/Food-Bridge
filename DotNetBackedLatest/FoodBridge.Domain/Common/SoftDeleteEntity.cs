using FoodBridge.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;

public abstract class SoftDeleteEntity : BaseEntity
{
    public DateTime? DeletedAt { get; set; }

    [NotMapped]
    public bool IsDeleted => DeletedAt.HasValue;
}