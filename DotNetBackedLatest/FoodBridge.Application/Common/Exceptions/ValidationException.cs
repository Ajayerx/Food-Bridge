using FluentValidation.Results;

namespace FoodBridge.Application.Common.Exceptions;

public class ValidationException : Exception
{
    public IReadOnlyList<ValidationFailure> Errors { get; }

    public ValidationException(IEnumerable<ValidationFailure> errors)
        : base("One or more validation errors occurred.")
    {
        Errors = errors.ToList();
    }
}