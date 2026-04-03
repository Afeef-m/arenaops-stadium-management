using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.CoreService.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBowlTemplateFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "NumSections",
                table: "Bowls",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "TemplateInnerRadius",
                table: "Bowls",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "TemplateOuterRadius",
                table: "Bowls",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TemplateRows",
                table: "Bowls",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TemplateSeatsPerRow",
                table: "Bowls",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NumSections",
                table: "Bowls");

            migrationBuilder.DropColumn(
                name: "TemplateInnerRadius",
                table: "Bowls");

            migrationBuilder.DropColumn(
                name: "TemplateOuterRadius",
                table: "Bowls");

            migrationBuilder.DropColumn(
                name: "TemplateRows",
                table: "Bowls");

            migrationBuilder.DropColumn(
                name: "TemplateSeatsPerRow",
                table: "Bowls");
        }
    }
}
