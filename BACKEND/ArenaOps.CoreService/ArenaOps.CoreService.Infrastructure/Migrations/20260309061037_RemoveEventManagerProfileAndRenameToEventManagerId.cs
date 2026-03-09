using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.CoreService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEventManagerProfileAndRenameToEventManagerId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "OrganizerId",
                table: "Events",
                newName: "EventManagerId");

            // migrationBuilder.RenameIndex(
            //     name: "IX_Events_OrganizerId",
            //     table: "Events",
            //     newName: "IX_Events_EventManagerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "EventManagerId",
                table: "Events",
                newName: "OrganizerId");

            migrationBuilder.RenameIndex(
                name: "IX_Events_EventManagerId",
                table: "Events",
                newName: "IX_Events_OrganizerId");
        }
    }
}
