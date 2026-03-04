using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArenaOps.CoreService.Infrastructure.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Sync-only migration — the Events table and all indexes already exist in the database.
    /// This migration updates the EF Core model snapshot to include the Event entity
    /// so future migrations generate correctly.
    /// </summary>
    public partial class SyncEventEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Events table, FK, and indexes already exist in the database.
            // This migration only syncs the EF Core model snapshot.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Nothing to reverse — no schema changes were made.
        }
    }
}
