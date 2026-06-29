using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDispatchOfferTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DispatchOffers",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AcceptedByAgentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DispatchOffers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DispatchOffers_DeliveryAgents_AcceptedByAgentId",
                        column: x => x.AcceptedByAgentId,
                        principalSchema: "dbo",
                        principalTable: "DeliveryAgents",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DispatchOffers_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "dbo",
                        principalTable: "Orders",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DispatchOffers_AcceptedByAgentId",
                schema: "dbo",
                table: "DispatchOffers",
                column: "AcceptedByAgentId");

            migrationBuilder.CreateIndex(
                name: "IX_DispatchOffers_OrderId_Status",
                schema: "dbo",
                table: "DispatchOffers",
                columns: new[] { "OrderId", "Status" },
                filter: "[Status] = 'Pending'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DispatchOffers",
                schema: "dbo");
        }
    }
}
