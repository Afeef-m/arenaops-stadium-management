using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.CoreService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStadiumLayoutBuilderSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create Bowls table
            migrationBuilder.CreateTable(
                name: "Bowls",
                columns: table => new
                {
                    BowlId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    SeatingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Color = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bowls", x => x.BowlId);
                    table.ForeignKey(
                        name: "FK_Bowls_SeatingPlans_SeatingPlanId",
                        column: x => x.SeatingPlanId,
                        principalTable: "SeatingPlans",
                        principalColumn: "SeatingPlanId",
                        onDelete: ReferentialAction.Cascade);
                });

            // Add columns to Sections table for Phase 4 layout builder support
            migrationBuilder.AddColumn<int>(
                name: "Rows",
                table: "Sections",
                type: "int",
                nullable: true,
                comment: "Number of rows in section (for Seated sections)");

            migrationBuilder.AddColumn<int>(
                name: "SeatsPerRow",
                table: "Sections",
                type: "int",
                nullable: true,
                comment: "Seats per row (for Seated sections)");

            migrationBuilder.AddColumn<string>(
                name: "VerticalAisles",
                table: "Sections",
                type: "nvarchar(max)",
                nullable: true,
                comment: "JSON array of vertical aisle indices: [10, 20]");

            migrationBuilder.AddColumn<string>(
                name: "HorizontalAisles",
                table: "Sections",
                type: "nvarchar(max)",
                nullable: true,
                comment: "JSON array of horizontal aisle row indices: [15]");

            migrationBuilder.AddColumn<string>(
                name: "GeometryType",
                table: "Sections",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                comment: "'arc' or 'rectangle'");

            migrationBuilder.AddColumn<string>(
                name: "GeometryData",
                table: "Sections",
                type: "nvarchar(max)",
                nullable: true,
                comment: "JSON serialized geometry (arc or rectangle properties)");

            migrationBuilder.AddColumn<Guid>(
                name: "BowlId",
                table: "Sections",
                type: "uniqueidentifier",
                nullable: true,
                comment: "Reference to parent Bowl (grouping sections into tiers)");

            // Add foreign key from Sections to Bowls
            migrationBuilder.AddForeignKey(
                name: "FK_Sections_Bowls_BowlId",
                table: "Sections",
                column: "BowlId",
                principalTable: "Bowls",
                principalColumn: "BowlId",
                onDelete: ReferentialAction.SetNull);

            // Add columns to Seats table for rendering support
            migrationBuilder.AddColumn<int>(
                name: "RowNumber",
                table: "Seats",
                type: "int",
                nullable: true,
                comment: "0-indexed row number within section for layout editor rendering");

            migrationBuilder.AddColumn<int>(
                name: "SeatIndexInRow",
                table: "Seats",
                type: "int",
                nullable: true,
                comment: "1-indexed seat index within its row");

            // Add columns to SeatingPlans table
            migrationBuilder.AddColumn<string>(
                name: "FieldConfigMetadata",
                table: "SeatingPlans",
                type: "nvarchar(max)",
                nullable: true,
                comment: "JSON serialized field configuration (shape, dimensions, buffer zone)");

            migrationBuilder.AddColumn<int>(
                name: "TotalCapacity",
                table: "SeatingPlans",
                type: "int",
                nullable: true,
                comment: "Total stadium capacity (cached, sum of all sections)");

            // Create indexes for performance
            migrationBuilder.CreateIndex(
                name: "IX_Bowls_SeatingPlanId",
                table: "Bowls",
                column: "SeatingPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_Bowls_DisplayOrder",
                table: "Bowls",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Sections_BowlId",
                table: "Sections",
                column: "BowlId");

            migrationBuilder.CreateIndex(
                name: "IX_Seats_RowNumber",
                table: "Seats",
                column: "RowNumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop indexes
            migrationBuilder.DropIndex(
                name: "IX_Seats_RowNumber",
                table: "Seats");

            migrationBuilder.DropIndex(
                name: "IX_Sections_BowlId",
                table: "Sections");

            migrationBuilder.DropIndex(
                name: "IX_Bowls_DisplayOrder",
                table: "Bowls");

            migrationBuilder.DropIndex(
                name: "IX_Bowls_SeatingPlanId",
                table: "Bowls");

            // Drop foreign key from Sections to Bowls
            migrationBuilder.DropForeignKey(
                name: "FK_Sections_Bowls_BowlId",
                table: "Sections");

            // Drop Bowls table
            migrationBuilder.DropTable(
                name: "Bowls");

            // Drop columns from SeatingPlans
            migrationBuilder.DropColumn(
                name: "TotalCapacity",
                table: "SeatingPlans");

            migrationBuilder.DropColumn(
                name: "FieldConfigMetadata",
                table: "SeatingPlans");

            // Drop columns from Seats
            migrationBuilder.DropColumn(
                name: "SeatIndexInRow",
                table: "Seats");

            migrationBuilder.DropColumn(
                name: "RowNumber",
                table: "Seats");

            // Drop columns from Sections
            migrationBuilder.DropColumn(
                name: "BowlId",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "GeometryData",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "GeometryType",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "HorizontalAisles",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "VerticalAisles",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "SeatsPerRow",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "Rows",
                table: "Sections");
        }
    }
}
