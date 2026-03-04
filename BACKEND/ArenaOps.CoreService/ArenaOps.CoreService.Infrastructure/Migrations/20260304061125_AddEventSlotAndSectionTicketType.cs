using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.CoreService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEventSlotAndSectionTicketType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventSlots",
                columns: table => new
                {
                    EventSlotId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSlots", x => x.EventSlotId);
                    table.ForeignKey(
                        name: "FK_EventSlots_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "EventId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SectionTicketTypes",
                columns: table => new
                {
                    EventSectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SectionTicketTypes", x => new { x.EventSectionId, x.TicketTypeId });
                    table.ForeignKey(
                        name: "FK_SectionTicketTypes_EventSections_EventSectionId",
                        column: x => x.EventSectionId,
                        principalTable: "EventSections",
                        principalColumn: "EventSectionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SectionTicketTypes_TicketTypes_TicketTypeId",
                        column: x => x.TicketTypeId,
                        principalTable: "TicketTypes",
                        principalColumn: "TicketTypeId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventSlots_EventId",
                table: "EventSlots",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_SectionTicketTypes_TicketTypeId",
                table: "SectionTicketTypes",
                column: "TicketTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_TicketTypes_Events_EventId",
                table: "TicketTypes",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "EventId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TicketTypes_Events_EventId",
                table: "TicketTypes");

            migrationBuilder.DropTable(
                name: "EventSlots");

            migrationBuilder.DropTable(
                name: "SectionTicketTypes");
        }
    }
}
