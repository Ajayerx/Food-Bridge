using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVendorBankHolderName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BankHolderName",
                schema: "dbo",
                table: "Vendors",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BankHolderName",
                schema: "dbo",
                table: "Vendors");
        }
    }
}
