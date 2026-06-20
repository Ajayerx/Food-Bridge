using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRestaurantRegistrationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AvgPrepMinutes",
                schema: "dbo",
                table: "Restaurants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Cuisines",
                schema: "dbo",
                table: "Restaurants",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeliveryEnabled",
                schema: "dbo",
                table: "Restaurants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDineInEnabled",
                schema: "dbo",
                table: "Restaurants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTakeawayEnabled",
                schema: "dbo",
                table: "Restaurants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OperatingHours",
                schema: "dbo",
                table: "Restaurants",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvgPrepMinutes",
                schema: "dbo",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "Cuisines",
                schema: "dbo",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "IsDeliveryEnabled",
                schema: "dbo",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "IsDineInEnabled",
                schema: "dbo",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "IsTakeawayEnabled",
                schema: "dbo",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "OperatingHours",
                schema: "dbo",
                table: "Restaurants");
        }
    }
}
