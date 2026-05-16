using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncTableStatusColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAvailable",
                schema: "dbo",
                table: "RestaurantTables");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                schema: "dbo",
                table: "RestaurantTables",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<Guid>(
                name: "CustomerId",
                schema: "dbo",
                table: "Orders",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.CreateTable(
                name: "Banners",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SubTitle = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    LinkUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    LinkType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    StartsAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndsAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Banners", x => x.Id);
                });

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 10, 9, 55, 13, 770, DateTimeKind.Utc).AddTicks(4609));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000002"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 10, 9, 55, 13, 770, DateTimeKind.Utc).AddTicks(4620));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000003"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 10, 9, 55, 13, 770, DateTimeKind.Utc).AddTicks(4625));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000004"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 10, 9, 55, 13, 770, DateTimeKind.Utc).AddTicks(4629));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000005"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 10, 9, 55, 13, 770, DateTimeKind.Utc).AddTicks(4634));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000006"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 10, 9, 55, 13, 770, DateTimeKind.Utc).AddTicks(4657));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000007"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 10, 9, 55, 13, 770, DateTimeKind.Utc).AddTicks(4661));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000008"),
                column: "CreatedAt",
                value: new DateTime(2026, 4, 10, 9, 55, 13, 770, DateTimeKind.Utc).AddTicks(4665));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Banners",
                schema: "dbo");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "dbo",
                table: "RestaurantTables");

            migrationBuilder.AddColumn<bool>(
                name: "IsAvailable",
                schema: "dbo",
                table: "RestaurantTables",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<Guid>(
                name: "CustomerId",
                schema: "dbo",
                table: "Orders",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2026, 3, 26, 12, 44, 56, 162, DateTimeKind.Utc).AddTicks(6315));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000002"),
                column: "CreatedAt",
                value: new DateTime(2026, 3, 26, 12, 44, 56, 162, DateTimeKind.Utc).AddTicks(6320));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000003"),
                column: "CreatedAt",
                value: new DateTime(2026, 3, 26, 12, 44, 56, 162, DateTimeKind.Utc).AddTicks(6325));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000004"),
                column: "CreatedAt",
                value: new DateTime(2026, 3, 26, 12, 44, 56, 162, DateTimeKind.Utc).AddTicks(6329));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000005"),
                column: "CreatedAt",
                value: new DateTime(2026, 3, 26, 12, 44, 56, 162, DateTimeKind.Utc).AddTicks(6333));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000006"),
                column: "CreatedAt",
                value: new DateTime(2026, 3, 26, 12, 44, 56, 162, DateTimeKind.Utc).AddTicks(6337));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000007"),
                column: "CreatedAt",
                value: new DateTime(2026, 3, 26, 12, 44, 56, 162, DateTimeKind.Utc).AddTicks(6353));

            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "PlatformSettings",
                keyColumn: "Id",
                keyValue: new Guid("10000001-0000-0000-0000-000000000008"),
                column: "CreatedAt",
                value: new DateTime(2026, 3, 26, 12, 44, 56, 162, DateTimeKind.Utc).AddTicks(6357));
        }
    }
}
