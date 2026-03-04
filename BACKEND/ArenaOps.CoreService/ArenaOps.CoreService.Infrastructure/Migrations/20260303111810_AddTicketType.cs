using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.CoreService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventSeatingPlans",
                columns: table => new
                {
                    EventSeatingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceSeatingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsLocked = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSeatingPlans", x => x.EventSeatingPlanId);
                    table.ForeignKey(
                        name: "FK_EventSeatingPlans_SeatingPlans_SourceSeatingPlanId",
                        column: x => x.SourceSeatingPlanId,
                        principalTable: "SeatingPlans",
                        principalColumn: "SeatingPlanId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TicketTypes",
                columns: table => new
                {
                    TicketTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SalePLU = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketTypes", x => x.TicketTypeId);
                });

            migrationBuilder.CreateTable(
                name: "EventLandmarks",
                columns: table => new
                {
                    EventLandmarkId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    EventSeatingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceFeatureId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Label = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PosX = table.Column<double>(type: "float", nullable: false),
                    PosY = table.Column<double>(type: "float", nullable: false),
                    Width = table.Column<double>(type: "float", nullable: false),
                    Height = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventLandmarks", x => x.EventLandmarkId);
                    table.ForeignKey(
                        name: "FK_EventLandmarks_EventSeatingPlans_EventSeatingPlanId",
                        column: x => x.EventSeatingPlanId,
                        principalTable: "EventSeatingPlans",
                        principalColumn: "EventSeatingPlanId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventLandmarks_Landmarks_SourceFeatureId",
                        column: x => x.SourceFeatureId,
                        principalTable: "Landmarks",
                        principalColumn: "FeatureId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "EventSections",
                columns: table => new
                {
                    EventSectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    EventSeatingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceSectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    SeatType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Color = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    PosX = table.Column<double>(type: "float", nullable: false),
                    PosY = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSections", x => x.EventSectionId);
                    table.ForeignKey(
                        name: "FK_EventSections_EventSeatingPlans_EventSeatingPlanId",
                        column: x => x.EventSeatingPlanId,
                        principalTable: "EventSeatingPlans",
                        principalColumn: "EventSeatingPlanId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventSections_Sections_SourceSectionId",
                        column: x => x.SourceSectionId,
                        principalTable: "Sections",
                        principalColumn: "SectionId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Stadiums_City",
                table: "Stadiums",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_Stadiums_OwnerId",
                table: "Stadiums",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Seats_RowLabel",
                table: "Seats",
                column: "RowLabel");

            migrationBuilder.CreateIndex(
                name: "IX_EventLandmarks_EventSeatingPlanId",
                table: "EventLandmarks",
                column: "EventSeatingPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_EventLandmarks_SourceFeatureId",
                table: "EventLandmarks",
                column: "SourceFeatureId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSeatingPlans_EventId",
                table: "EventSeatingPlans",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSeatingPlans_SourceSeatingPlanId",
                table: "EventSeatingPlans",
                column: "SourceSeatingPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSections_EventSeatingPlanId",
                table: "EventSections",
                column: "EventSeatingPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSections_SourceSectionId",
                table: "EventSections",
                column: "SourceSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketTypes_EventId",
                table: "TicketTypes",
                column: "EventId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventLandmarks");

            migrationBuilder.DropTable(
                name: "EventSections");

            migrationBuilder.DropTable(
                name: "TicketTypes");

            migrationBuilder.DropTable(
                name: "EventSeatingPlans");

            migrationBuilder.DropIndex(
                name: "IX_Stadiums_City",
                table: "Stadiums");

            migrationBuilder.DropIndex(
                name: "IX_Stadiums_OwnerId",
                table: "Stadiums");

            migrationBuilder.DropIndex(
                name: "IX_Seats_RowLabel",
                table: "Seats");
        }
    }
}
