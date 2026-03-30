using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.CoreService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEventBowlSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventBowls",
                columns: table => new
                {
                    EventBowlId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    EventSeatingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceBowlId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Color = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventBowls", x => x.EventBowlId);
                    table.ForeignKey(
                        name: "FK_EventBowls_Bowls_SourceBowlId",
                        column: x => x.SourceBowlId,
                        principalTable: "Bowls",
                        principalColumn: "BowlId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_EventBowls_EventSeatingPlans_EventSeatingPlanId",
                        column: x => x.EventSeatingPlanId,
                        principalTable: "EventSeatingPlans",
                        principalColumn: "EventSeatingPlanId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventBowls_EventSeatingPlanId",
                table: "EventBowls",
                column: "EventSeatingPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_EventBowls_SourceBowlId",
                table: "EventBowls",
                column: "SourceBowlId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventBowls");
        }
    }
}
