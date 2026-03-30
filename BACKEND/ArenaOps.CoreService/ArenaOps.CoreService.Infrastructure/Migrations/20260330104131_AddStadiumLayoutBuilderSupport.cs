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
            migrationBuilder.AddColumn<Guid>(
                name: "BowlId",
                table: "Sections",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GeometryData",
                table: "Sections",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GeometryType",
                table: "Sections",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HorizontalAisles",
                table: "Sections",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Rows",
                table: "Sections",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SeatsPerRow",
                table: "Sections",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerticalAisles",
                table: "Sections",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RowNumber",
                table: "Seats",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SeatIndexInRow",
                table: "Seats",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FieldConfigMetadata",
                table: "SeatingPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalCapacity",
                table: "SeatingPlans",
                type: "int",
                nullable: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_Sections_BowlId",
                table: "Sections",
                column: "BowlId");

            migrationBuilder.CreateIndex(
                name: "IX_Bowls_DisplayOrder",
                table: "Bowls",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Bowls_SeatingPlanId",
                table: "Bowls",
                column: "SeatingPlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_Sections_Bowls_BowlId",
                table: "Sections",
                column: "BowlId",
                principalTable: "Bowls",
                principalColumn: "BowlId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Sections_Bowls_BowlId",
                table: "Sections");

            migrationBuilder.DropTable(
                name: "Bowls");

            migrationBuilder.DropIndex(
                name: "IX_Sections_BowlId",
                table: "Sections");

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
                name: "Rows",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "SeatsPerRow",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "VerticalAisles",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "RowNumber",
                table: "Seats");

            migrationBuilder.DropColumn(
                name: "SeatIndexInRow",
                table: "Seats");

            migrationBuilder.DropColumn(
                name: "FieldConfigMetadata",
                table: "SeatingPlans");

            migrationBuilder.DropColumn(
                name: "TotalCapacity",
                table: "SeatingPlans");
        }
    }
}
