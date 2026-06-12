using FluentValidation.TestHelper;
using FoodBridge.Application.Features.Users.Commands.AddAddress;
using FoodBridge.Application.Features.Users.Commands.UpdateAddress;
using Xunit;

namespace FoodBridge.Tests.Application.Addresses;

public class AddressValidatorTests
{
    private readonly AddAddressCommandValidator _addValidator = new();
    private readonly UpdateAddressCommandValidator _updateValidator = new();

    private static AddAddressCommand ValidAddCommand => new(
        UserId: Guid.NewGuid(),
        Label: "Home",
        AddressLine1: "123 Main Street",
        AddressLine2: "Apt 4B",
        City: "Indore",
        State: "Madhya Pradesh",
        PinCode: "452010",
        Latitude: 22.7196m,
        Longitude: 75.8577m,
        IsDefault: false);

    private static UpdateAddressCommand ValidUpdateCommand => new(
        AddressId: Guid.NewGuid(),
        UserId: Guid.NewGuid(),
        Label: "Work",
        AddressLine1: "456 Office Road",
        AddressLine2: "Floor 7",
        City: "Mumbai",
        State: "Maharashtra",
        PinCode: "400001",
        Latitude: 19.0760m,
        Longitude: 72.8777m,
        IsDefault: true);

    [Fact]
    public void Valid_Address_Passes_All_Rules()
    {
        var result = _addValidator.TestValidate(ValidAddCommand);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Empty_Label_Returns_Correct_Message()
    {
        var cmd = ValidAddCommand with { Label = "" };
        var result = _addValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Label)
              .WithErrorMessage("Please enter or select an address label.");
    }

    [Fact]
    public void Empty_AddressLine1_Returns_Correct_Message()
    {
        var cmd = ValidAddCommand with { AddressLine1 = "" };
        var result = _addValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.AddressLine1)
              .WithErrorMessage("Street address is required.");
    }

    [Fact]
    public void Empty_City_Returns_Correct_Message()
    {
        var cmd = ValidAddCommand with { City = "" };
        var result = _addValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.City)
              .WithErrorMessage("City is required.");
    }

    [Fact]
    public void Empty_State_Returns_Correct_Message()
    {
        var cmd = ValidAddCommand with { State = "" };
        var result = _addValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.State)
              .WithErrorMessage("State is required.");
    }

    [Fact]
    public void PinCode_Starting_With_Zero_Fails()
    {
        var cmd = ValidAddCommand with { PinCode = "012345" };
        var result = _addValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.PinCode)
              .WithErrorMessage("Please enter a valid 6-digit Indian PIN code.");
    }

    [Fact]
    public void PinCode_Five_Digits_Fails()
    {
        var cmd = ValidAddCommand with { PinCode = "12345" };
        var result = _addValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.PinCode)
              .WithErrorMessage("Please enter a valid 6-digit Indian PIN code.");
    }

    [Fact]
    public void PinCode_Seven_Digits_Fails()
    {
        var cmd = ValidAddCommand with { PinCode = "1234567" };
        var result = _addValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.PinCode)
              .WithErrorMessage("Please enter a valid 6-digit Indian PIN code.");
    }

    [Fact]
    public void PinCode_Valid_Six_Digits_Passes()
    {
        var cmd = ValidAddCommand with { PinCode = "452010" };
        var result = _addValidator.TestValidate(cmd);
        result.ShouldNotHaveValidationErrorFor(x => x.PinCode);
    }

    [Fact]
    public void Latitude_Zero_Fails_With_Coordinates_Message()
    {
        var cmd = ValidAddCommand with { Latitude = 0 };
        var result = _addValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Latitude)
              .WithErrorMessage("Location coordinates are missing. Please use current location or search.");
    }

    [Fact]
    public void Latitude_Above_90_Fails_With_Range_Message()
    {
        var cmd = ValidAddCommand with { Latitude = 91m };
        var result = _addValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Latitude)
              .WithErrorMessage("Latitude must be between -90 and 90.");
    }

    [Fact]
    public void Longitude_Below_Minus180_Fails_With_Range_Message()
    {
        var cmd = ValidAddCommand with { Longitude = -181m };
        var result = _addValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Longitude)
              .WithErrorMessage("Longitude must be between -180 and 180.");
    }

    [Fact]
    public void Latitude_And_Longitude_Valid_Range_Passes()
    {
        var cmd = ValidAddCommand with { Latitude = 22.7196m, Longitude = 75.8577m };
        var result = _addValidator.TestValidate(cmd);
        result.ShouldNotHaveValidationErrorFor(x => x.Latitude);
        result.ShouldNotHaveValidationErrorFor(x => x.Longitude);
    }

    [Fact]
    public void UpdateValidator_Valid_Address_Passes_All_Rules()
    {
        var result = _updateValidator.TestValidate(ValidUpdateCommand);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void UpdateValidator_Latitude_Zero_Fails()
    {
        var cmd = ValidUpdateCommand with { Latitude = 0 };
        var result = _updateValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Latitude);
    }

    [Fact]
    public void UpdateValidator_PinCode_Starting_With_Zero_Fails()
    {
        var cmd = ValidUpdateCommand with { PinCode = "012345" };
        var result = _updateValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.PinCode)
              .WithErrorMessage("Please enter a valid 6-digit Indian PIN code.");
    }
}
