using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.CoreService.Infrastructure.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// ARENA-84: Drop obsolete columns from the Events table.
    /// StartTime (NOT NULL) was never part of the EF Core model.
    /// The RemoveObsoleteEventColumns migration (20260309065852) had an empty
    /// body and never ran the DROP, causing INSERT to fail with a NULL
    /// constraint violation on every CreateEvent call.
    /// IsLive is also obsolete (replaced by Status column).
    /// Event timing lives in EventSlots (StartTime / EndTime), not on Events.
    /// </summary>
    public partial class ARENA84_DropObsoleteEventColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "IsLive",
                table: "Events");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "StartTime",
                table: "Events",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.AddColumn<bool>(
                name: "IsLive",
                table: "Events",
                type: "bit",
                nullable: true);
        }
    }
}
