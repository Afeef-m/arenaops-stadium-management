using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.CoreService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ARENA78_AddMissingEventSeatColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventSeats_Status",
                table: "EventSeats");

            migrationBuilder.AddColumn<Guid>(
                name: "EventId",
                table: "EventSeats",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "LockedByUserId",
                table: "EventSeats",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LockedUntil",
                table: "EventSeats",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SectionType",
                table: "EventSeats",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_EventSeats_EventId",
                table: "EventSeats",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSeats_EventId_Status",
                table: "EventSeats",
                columns: new[] { "EventId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_EventSeats_LockedUntil",
                table: "EventSeats",
                column: "LockedUntil",
                filter: "[Status] = 'Held'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventSeats_EventId",
                table: "EventSeats");

            migrationBuilder.DropIndex(
                name: "IX_EventSeats_EventId_Status",
                table: "EventSeats");

            migrationBuilder.DropIndex(
                name: "IX_EventSeats_LockedUntil",
                table: "EventSeats");

            migrationBuilder.DropColumn(
                name: "EventId",
                table: "EventSeats");

            migrationBuilder.DropColumn(
                name: "LockedByUserId",
                table: "EventSeats");

            migrationBuilder.DropColumn(
                name: "LockedUntil",
                table: "EventSeats");

            migrationBuilder.DropColumn(
                name: "SectionType",
                table: "EventSeats");

            migrationBuilder.CreateIndex(
                name: "IX_EventSeats_Status",
                table: "EventSeats",
                column: "Status");
        }
    }
}
