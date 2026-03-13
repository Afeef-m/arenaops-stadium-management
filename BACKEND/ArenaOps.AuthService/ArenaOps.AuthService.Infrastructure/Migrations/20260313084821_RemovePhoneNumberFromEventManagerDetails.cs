using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.AuthService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemovePhoneNumberFromEventManagerDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "EventManagerDetails");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "EventManagerDetails",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);
        }
    }
}
