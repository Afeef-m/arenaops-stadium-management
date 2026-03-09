using Microsoft.EntityFrameworkCore;
using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Infrastructure.Data;

public class CoreDbContext : DbContext
{
    public CoreDbContext(DbContextOptions<CoreDbContext> options) : base(options) { }

    public DbSet<Stadium> Stadiums => Set<Stadium>();
    public DbSet<SeatingPlan> SeatingPlans => Set<SeatingPlan>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<Landmark> Landmarks => Set<Landmark>();
    public DbSet<Event> Events => Set<Event>();

    // ─── Event Layout Tables (cloned from templates) ────────────
    public DbSet<EventSeatingPlan> EventSeatingPlans => Set<EventSeatingPlan>();
    public DbSet<EventSection> EventSections => Set<EventSection>();
    public DbSet<EventLandmark> EventLandmarks => Set<EventLandmark>();

    // ─── Ticketing & Pricing ────────────────────────────────────
    public DbSet<TicketType> TicketTypes => Set<TicketType>();
    public DbSet<SectionTicketType> SectionTicketTypes => Set<SectionTicketType>();

    // ─── Event Time Slots ───────────────────────────────────────
    public DbSet<EventSlot> EventSlots => Set<EventSlot>();

    // ─── Event Manager Profiles ──────────────────────────────────────
    public DbSet<EventManagerProfile> EventManagerProfiles => Set<EventManagerProfile>();


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

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.HasIndex(e => e.StadiumId);

            entity.HasMany(e => e.Sections)
                  .WithOne(s => s.SeatingPlan)
                  .HasForeignKey(s => s.SeatingPlanId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Landmarks)
                  .WithOne(l => l.SeatingPlan)
                  .HasForeignKey(l => l.SeatingPlanId)
                  .OnDelete(DeleteBehavior.Cascade);
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
            entity.HasIndex(e => e.SeatingPlanId);

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

            // Children — Cascade: deleting a layout removes its sections + landmarks
            entity.HasMany(e => e.EventSections)
                  .WithOne(es => es.EventSeatingPlan)
                  .HasForeignKey(es => es.EventSeatingPlanId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.EventLandmarks)
                  .WithOne(el => el.EventSeatingPlan)
                  .HasForeignKey(el => el.EventSeatingPlanId)
                  .OnDelete(DeleteBehavior.Cascade);
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

        // ─── EventManagerProfile ─────────────────────────────────────────
        // WHY UNIQUE index on EventManagerId?
        // One event manager can have exactly one business profile.
        // The UNIQUE index enforces this at the DB level — the service layer
        // also checks via ExistsByEventManagerIdAsync before inserting (belt + suspenders).
        //
        // WHY no FK to Event.EventManagerId?
        // EventManagerId is a cross-service reference to Auth.Users.UserId.
        // Same pattern as Stadium.OwnerId — logical reference, not a DB FK.
        modelBuilder.Entity<EventManagerProfile>(entity =>
        {
            entity.HasKey(e => e.EventManagerProfileId);
            entity.Property(e => e.EventManagerProfileId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.OrganizationName).HasMaxLength(200);
            entity.Property(e => e.GstNumber).HasMaxLength(20);
            entity.Property(e => e.Designation).HasMaxLength(100);
            entity.Property(e => e.Website).HasMaxLength(300);
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            // One event manager → one profile. Enforced at DB + service layer.
            entity.HasIndex(e => e.EventManagerId).IsUnique();
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
    }
}
