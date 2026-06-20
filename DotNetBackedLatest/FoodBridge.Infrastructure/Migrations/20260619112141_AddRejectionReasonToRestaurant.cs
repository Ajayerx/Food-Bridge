using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRejectionReasonToRestaurant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                schema: "dbo",
                table: "Restaurants",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RejectionReason",
                schema: "dbo",
                table: "Restaurants");
        }
    }
}
