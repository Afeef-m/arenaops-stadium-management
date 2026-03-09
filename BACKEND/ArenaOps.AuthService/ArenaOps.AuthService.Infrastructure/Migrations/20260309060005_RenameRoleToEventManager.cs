using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.AuthService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameRoleToEventManager : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 3,
                column: "Name",
                value: "EventManager");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 3,
                column: "Name",
                value: "Organizer");
        }
    }
}
