using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.CoreService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ARENA78_AddEventSeatsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventSeats",
                columns: table => new
                {
                    EventSeatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    EventSectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceSeatId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowLabel = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    SeatNumber = table.Column<int>(type: "int", nullable: false),
                    SeatLabel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    PosX = table.Column<double>(type: "float", nullable: false),
                    PosY = table.Column<double>(type: "float", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    IsAccessible = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Price = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Available")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSeats", x => x.EventSeatId);
                    table.ForeignKey(
                        name: "FK_EventSeats_EventSections_EventSectionId",
                        column: x => x.EventSectionId,
                        principalTable: "EventSections",
                        principalColumn: "EventSectionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventSeats_Seats_SourceSeatId",
                        column: x => x.SourceSeatId,
                        principalTable: "Seats",
                        principalColumn: "SeatId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventSeats_EventSectionId",
                table: "EventSeats",
                column: "EventSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSeats_SourceSeatId",
                table: "EventSeats",
                column: "SourceSeatId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSeats_Status",
                table: "EventSeats",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventSeats");
        }
    }
}
