using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.CoreService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameOrganizerToEventManager : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop old OrganizerProfiles table if exists
            migrationBuilder.DropTable(
                name: "OrganizerProfiles",
                schema: null);

            // Rename OrganizerId column to EventManagerId in Events table
            migrationBuilder.RenameColumn(
                name: "OrganizerId",
                table: "Events",
                newName: "EventManagerId");

            // Create new EventManagerProfiles table
            migrationBuilder.CreateTable(
                name: "EventManagerProfiles",
                columns: table => new
                {
                    EventManagerProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    EventManagerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    GstNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Designation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Website = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventManagerProfiles", x => x.EventManagerProfileId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventManagerProfiles_EventManagerId",
                table: "EventManagerProfiles",
                column: "EventManagerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventManagerProfiles_Email",
                table: "EventManagerProfiles",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventManagerProfiles_PhoneNumber",
                table: "EventManagerProfiles",
                column: "PhoneNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop EventManagerProfiles table
            migrationBuilder.DropTable(
                name: "EventManagerProfiles");

            // Rename EventManagerId column back to OrganizerId in Events table
            migrationBuilder.RenameColumn(
                name: "EventManagerId",
                table: "Events",
                newName: "OrganizerId");

            // Recreate OrganizerProfiles table
            migrationBuilder.CreateTable(
                name: "OrganizerProfiles",
                columns: table => new
                {
                    OrganizerProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    OrganizerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    GstNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Designation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Website = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizerProfiles", x => x.OrganizerProfileId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrganizerProfiles_OrganizerId",
                table: "OrganizerProfiles",
                column: "OrganizerId",
                unique: true);
        }
    }
}
