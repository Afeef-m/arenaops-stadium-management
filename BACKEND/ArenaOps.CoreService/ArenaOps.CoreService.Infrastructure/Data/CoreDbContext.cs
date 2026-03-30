using Microsoft.EntityFrameworkCore;
using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Infrastructure.Data;

public class CoreDbContext : DbContext
{
    public CoreDbContext(DbContextOptions<CoreDbContext> options) : base(options) { }

    public DbSet<Stadium> Stadiums => Set<Stadium>();
    public DbSet<SeatingPlan> SeatingPlans => Set<SeatingPlan>();
    public DbSet<Bowl> Bowls => Set<Bowl>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<Landmark> Landmarks => Set<Landmark>();
    public DbSet<Event> Events => Set<Event>();

    // ─── Event Layout Tables (cloned from templates) ────────────
    public DbSet<EventSeatingPlan> EventSeatingPlans => Set<EventSeatingPlan>();
    public DbSet<EventBowl> EventBowls => Set<EventBowl>();
    public DbSet<EventSection> EventSections => Set<EventSection>();
    public DbSet<EventLandmark> EventLandmarks => Set<EventLandmark>();

    // ─── Event Seat Inventory ────────────────────────────────────
    public DbSet<EventSeat> EventSeats => Set<EventSeat>();

    // ─── Ticketing & Pricing ────────────────────────────────────
    public DbSet<TicketType> TicketTypes => Set<TicketType>();
    public DbSet<SectionTicketType> SectionTicketTypes => Set<SectionTicketType>();

    // ─── Event Time Slots ───────────────────────────────────────
    public DbSet<EventSlot> EventSlots => Set<EventSlot>();

    // ─── Admin Activity Logs ──────────────────────────────────────
    public DbSet<AdminActivity> AdminActivities => Set<AdminActivity>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ─── Stadium ───────────────────────────────────────────────
        modelBuilder.Entity<Stadium>(entity =>
        {
            entity.HasKey(e => e.StadiumId);
            entity.Property(e => e.StadiumId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Address).HasMaxLength(300).IsRequired();
            entity.Property(e => e.City).HasMaxLength(100).IsRequired();
            entity.Property(e => e.State).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Country).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Pincode).HasMaxLength(10).IsRequired();

            entity.Property(e => e.Latitude).HasPrecision(9, 6);
            entity.Property(e => e.Longitude).HasPrecision(9, 6);

            entity.Property(e => e.IsApproved).HasDefaultValue(false);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.OwnerId);
            entity.HasIndex(e => e.City);

            entity.HasMany(e => e.SeatingPlans)
                  .WithOne(sp => sp.Stadium)
                  .HasForeignKey(sp => sp.StadiumId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── SeatingPlan ───────────────────────────────────────────
        modelBuilder.Entity<SeatingPlan>(entity =>
        {
            entity.HasKey(e => e.SeatingPlanId);
            entity.Property(e => e.SeatingPlanId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);

            // Phase 4: Layout Builder Fields
            entity.Property(e => e.FieldConfigMetadata)
                  .HasColumnType("nvarchar(max)")
                  .IsRequired(false);
            entity.Property(e => e.TotalCapacity)
                  .IsRequired(false);

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.HasIndex(e => e.StadiumId);

            entity.HasMany(e => e.Sections)
                  .WithOne(s => s.SeatingPlan)
                  .HasForeignKey(s => s.SeatingPlanId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Bowls)
                  .WithOne(b => b.SeatingPlan)
                  .HasForeignKey(b => b.SeatingPlanId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Landmarks)
                  .WithOne(l => l.SeatingPlan)
                  .HasForeignKey(l => l.SeatingPlanId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Bowl ───────────────────────────────────────────────────
        modelBuilder.Entity<Bowl>(entity =>
        {
            entity.HasKey(e => e.BowlId);
            entity.Property(e => e.BowlId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Color).HasMaxLength(20);

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.SeatingPlanId);
            entity.HasIndex(e => e.DisplayOrder);

            entity.HasMany(e => e.Sections)
                  .WithOne(s => s.Bowl)
                  .HasForeignKey(s => s.BowlId)
                  .OnDelete(DeleteBehavior.NoAction)
                  .IsRequired(false);
        });

        // ─── Section ───────────────────────────────────────────────
        modelBuilder.Entity<Section>(entity =>
        {
            entity.HasKey(e => e.SectionId);
            entity.Property(e => e.SectionId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Type).HasMaxLength(20).IsRequired();
            entity.Property(e => e.SeatType).HasMaxLength(50);
            entity.Property(e => e.Color).HasMaxLength(20);

            // Phase 4: Geometry & Layout Fields
            entity.Property(e => e.Rows)
                  .IsRequired(false);
            entity.Property(e => e.SeatsPerRow)
                  .IsRequired(false);
            entity.Property(e => e.VerticalAisles)
                  .HasColumnType("nvarchar(max)")
                  .IsRequired(false);
            entity.Property(e => e.HorizontalAisles)
                  .HasColumnType("nvarchar(max)")
                  .IsRequired(false);
            entity.Property(e => e.GeometryType)
                  .HasMaxLength(20)
                  .IsRequired(false);
            entity.Property(e => e.GeometryData)
                  .HasColumnType("nvarchar(max)")
                  .IsRequired(false);

            entity.HasIndex(e => e.SeatingPlanId);
            entity.HasIndex(e => e.BowlId);

            entity.HasMany(e => e.Seats)
                  .WithOne(s => s.Section)
                  .HasForeignKey(s => s.SectionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Seat ──────────────────────────────────────────────────
        modelBuilder.Entity<Seat>(entity =>
        {
            entity.HasKey(e => e.SeatId);
            entity.Property(e => e.SeatId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.RowLabel).HasMaxLength(5);
            entity.Property(e => e.SeatLabel).HasMaxLength(10);

            // Price is nullable — assigned from SectionTicketType at seat generation time.
            // Precision matches TicketType.Price (10, 2) for consistency.
            entity.Property(e => e.Price).HasPrecision(10, 2).IsRequired(false);

            // Phase 4: Rendering & Layout Fields
            entity.Property(e => e.RowNumber)
                  .IsRequired(false);
            entity.Property(e => e.SeatIndexInRow)
                  .IsRequired(false);

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsAccessible).HasDefaultValue(false);
            entity.HasIndex(e => e.SectionId);
            entity.HasIndex(e => e.RowLabel);
        });

        // ─── Landmark ──────────────────────────────────────────────
        modelBuilder.Entity<Landmark>(entity =>
        {
            entity.HasKey(e => e.FeatureId);
            entity.Property(e => e.FeatureId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Label).HasMaxLength(100);
            entity.HasIndex(e => e.SeatingPlanId);
        });

        // ─── Event ──────────────────────────────────────────────────
        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasKey(e => e.EventId);
            entity.Property(e => e.EventId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Draft");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.StadiumId);
            entity.HasIndex(e => e.EventManagerId);
            entity.HasIndex(e => e.Status);

            entity.HasOne(e => e.Stadium)
                  .WithMany()
                  .HasForeignKey(e => e.StadiumId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── EventSeatingPlan (Event-specific clone of SeatingPlan) ──
        // WHY Restrict on SourceSeatingPlan FK?
        // Deleting a template should NOT cascade-delete all event layouts
        // that were cloned from it. Event layouts are independent copies.
        modelBuilder.Entity<EventSeatingPlan>(entity =>
        {
            entity.HasKey(e => e.EventSeatingPlanId);
            entity.Property(e => e.EventSeatingPlanId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.IsLocked).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            // Indexes — EventId is the primary lookup key (from route parameter)
            entity.HasIndex(e => e.EventId);
            entity.HasIndex(e => e.SourceSeatingPlanId);

            // FK to source SeatingPlan template — Restrict prevents cascade delete
            entity.HasOne(e => e.SourceSeatingPlan)
                  .WithMany()
                  .HasForeignKey(e => e.SourceSeatingPlanId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.EventBowls)
                  .WithOne(eb => eb.EventSeatingPlan)
                  .HasForeignKey(eb => eb.EventSeatingPlanId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.EventSections)
                  .WithOne(es => es.EventSeatingPlan)
                  .HasForeignKey(es => es.EventSeatingPlanId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.EventLandmarks)
                  .WithOne(el => el.EventSeatingPlan)
                  .HasForeignKey(el => el.EventSeatingPlanId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── EventBowl (Event-specific clone of Bowl) ──────────────
        // WHY SetNull on SourceBowl FK?
        // If a template bowl is deleted, the event copies should survive.
        // SetNull preserves the cloned records (SourceBowlId becomes NULL).
        modelBuilder.Entity<EventBowl>(entity =>
        {
            entity.HasKey(e => e.EventBowlId);
            entity.Property(e => e.EventBowlId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Color).HasMaxLength(20);

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.EventSeatingPlanId);
            entity.HasIndex(e => e.SourceBowlId);

            // Nullable FK — NULL means organizer added this bowl manually
            entity.HasOne(e => e.SourceBowl)
                  .WithMany()
                  .HasForeignKey(e => e.SourceBowlId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .IsRequired(false);
        });

        // ─── EventSection (Event-specific clone of Section) ─────────
        // WHY SetNull on SourceSection FK?
        // If a template section is deleted, the event copies should survive.
        // SetNull preserves the cloned records (SourceSectionId becomes NULL).
        modelBuilder.Entity<EventSection>(entity =>
        {
            entity.HasKey(e => e.EventSectionId);
            entity.Property(e => e.EventSectionId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Type).HasMaxLength(20).IsRequired();
            entity.Property(e => e.SeatType).HasMaxLength(50);
            entity.Property(e => e.Color).HasMaxLength(20);

            entity.HasIndex(e => e.EventSeatingPlanId);
            entity.HasIndex(e => e.SourceSectionId);

            // Nullable FK — NULL means organizer added this section manually
            entity.HasOne(e => e.SourceSection)
                  .WithMany()
                  .HasForeignKey(e => e.SourceSectionId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .IsRequired(false);
        });

        // ─── EventLandmark (Event-specific clone of Landmark) ──────
        modelBuilder.Entity<EventLandmark>(entity =>
        {
            entity.HasKey(e => e.EventLandmarkId);
            entity.Property(e => e.EventLandmarkId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Label).HasMaxLength(100);

            entity.HasIndex(e => e.EventSeatingPlanId);
            entity.HasIndex(e => e.SourceFeatureId);

            // Nullable FK — same pattern as EventSection
            entity.HasOne(e => e.SourceLandmark)
                  .WithMany()
                  .HasForeignKey(e => e.SourceFeatureId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .IsRequired(false);
        });

        // ─── TicketType (Pricing per Event) ─────────────────────────
        modelBuilder.Entity<TicketType>(entity =>
        {
            entity.HasKey(e => e.TicketTypeId);
            entity.Property(e => e.TicketTypeId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.SalePLU).HasMaxLength(50);
            entity.Property(e => e.Price).HasPrecision(10, 2);

            entity.HasIndex(e => e.EventId);

            // FK to Event — Restrict prevents cascade cycle
            entity.HasOne(e => e.Event)
                  .WithMany()
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── EventSlot (Time slots per Event) ───────────────────────
        modelBuilder.Entity<EventSlot>(entity =>
        {
            entity.HasKey(e => e.EventSlotId);
            entity.Property(e => e.EventSlotId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.StartTime).IsRequired();
            entity.Property(e => e.EndTime).IsRequired();

            entity.HasIndex(e => e.EventId);

            // FK to Event — Cascade: deleting an event removes its time slots
            entity.HasOne(e => e.Event)
                  .WithMany(ev => ev.EventSlots)
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── SectionTicketType (Many-to-many: EventSection ↔ TicketType) ─
        // WHY composite PK? This is a pure join table — no surrogate key needed.
        // WHY Cascade from EventSection but Restrict from TicketType?
        //   - Deleting a section should clean up its mappings.
        //   - Deleting a ticket type should be blocked if sections reference it.
        modelBuilder.Entity<SectionTicketType>(entity =>
        {
            entity.HasKey(e => new { e.EventSectionId, e.TicketTypeId });

            entity.HasOne(e => e.EventSection)
                  .WithMany(es => es.SectionTicketTypes)
                  .HasForeignKey(e => e.EventSectionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.TicketType)
                  .WithMany(tt => tt.SectionTicketTypes)
                  .HasForeignKey(e => e.TicketTypeId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── EventSeat (Event-specific seat inventory) ──────────────
        // WHY Cascade from EventSection?
        //   Deleting an EventSection removes all its EventSeats — no orphans.
        // WHY SetNull on SourceSeat FK?
        //   If a template Seat is later deleted, the EventSeat record survives
        //   with SourceSeatId = NULL. The event seat data is still valid.
        // WHY no Cascade from Seat → EventSeat?
        //   SetNull (not Cascade) is used so that removing a template seat
        //   does not wipe out already-sold or available event seats.
        modelBuilder.Entity<EventSeat>(entity =>
        {
            entity.HasKey(e => e.EventSeatId);
            entity.Property(e => e.EventSeatId).HasDefaultValueSql("NEWSEQUENTIALID()");

            // WHY index on EventId only (no FK constraint)?
            // EventId is a denormalized lookup key following the same pattern as
            // EventSeatingPlan.EventId — an indexed column without a DB FK constraint.
            // This avoids a multiple cascade paths issue (Event→EventSeatingPlan→EventSection→EventSeat
            // already handles cascades; a second direct Event→EventSeat cascade would conflict).
            entity.HasIndex(e => e.EventId);

            entity.Property(e => e.RowLabel).HasMaxLength(5);
            // SeatLabel is wider than the template Seat.SeatLabel (10) to support "GA-100" style labels.
            entity.Property(e => e.SeatLabel).HasMaxLength(20);
            // SectionType is denormalized from EventSection.Type for query performance on booking paths.
            entity.Property(e => e.SectionType).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Available");
            entity.Property(e => e.Price).HasPrecision(10, 2).IsRequired(false);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsAccessible).HasDefaultValue(false);
            // LockedUntil and LockedByUserId are NULL when Available/Confirmed.
            // Set by sp_HoldSeat, cleared by sp_ConfirmBookingSeats + sp_CleanupExpiredHolds.
            entity.Property(e => e.LockedUntil).IsRequired(false);
            entity.Property(e => e.LockedByUserId).IsRequired(false);

            entity.HasIndex(e => e.EventSectionId);
            entity.HasIndex(e => e.SourceSeatId);
            // Composite index matches docs: IX_EventSeat_EventId_Status — used by booking queries.
            entity.HasIndex(e => new { e.EventId, e.Status });
            // Filtered index matches docs: IX_EventSeat_LockedUntil — only for held seats.
            entity.HasIndex(e => e.LockedUntil).HasFilter("[Status] = 'Held'");

            // FK to EventSection — Cascade: section deleted → all its seats deleted
            entity.HasOne(e => e.EventSection)
                  .WithMany(es => es.EventSeats)
                  .HasForeignKey(e => e.EventSectionId)
                  .OnDelete(DeleteBehavior.Cascade);

            // FK to template Seat — SetNull: template seat deleted → SourceSeatId becomes NULL
            entity.HasOne(e => e.SourceSeat)
                  .WithMany()
                  .HasForeignKey(e => e.SourceSeatId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .IsRequired(false);
        });

        // ─── AdminActivity (Admin Dashboard Activity Feed) ───────────
        modelBuilder.Entity<AdminActivity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.ActivityType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500).IsRequired();
            entity.Property(e => e.EntityId).HasMaxLength(100);
            entity.Property(e => e.EntityType).HasMaxLength(50);
            entity.Property(e => e.UserName).HasMaxLength(200);
            entity.Property(e => e.UserEmail).HasMaxLength(256);
            entity.Property(e => e.Metadata).HasMaxLength(2000);
            entity.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.ActivityType);
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => e.UserId);
        });
    }
}
