using ArenaOps.AuthService.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.AuthService.Infrastructure.Data;

public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuthAuditLog> AuthAuditLogs => Set<AuthAuditLog>();
    public DbSet<ExternalLogin> ExternalLogins => Set<ExternalLogin>();
    public DbSet<EventManagerDetails> EventManagerDetails => Set<EventManagerDetails>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // =====================
        // USER CONFIGURATION
        // =====================
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.UserId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.Email).IsUnique();

            entity.Property(e => e.PasswordHash).IsRequired(false).HasMaxLength(500);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.ProfilePictureUrl).HasMaxLength(500);
            entity.Property(e => e.AuthProvider).IsRequired().HasMaxLength(20).HasDefaultValue("Local");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsEmailVerified).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

            // Password Reset OTP
            entity.Property(e => e.PasswordResetOtpHash).IsRequired(false).HasMaxLength(128);
            entity.Property(e => e.PasswordResetOtpExpiresAt).IsRequired(false);
        });

        // =====================
        // ROLE CONFIGURATION
        // =====================
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId);

            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Name).IsUnique();

            // Seed default roles
            entity.HasData(
                new Role { RoleId = 1, Name = "Admin" },
                new Role { RoleId = 2, Name = "StadiumOwner" },
                new Role { RoleId = 3, Name = "EventManager" },
                new Role { RoleId = 4, Name = "User" }
            );
        });

        // =====================
        // USER ROLE CONFIGURATION (Composite PK)
        // =====================
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RoleId });

            entity.HasOne(e => e.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // =====================
        // REFRESH TOKEN CONFIGURATION
        // =====================
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.TokenId);
            entity.Property(e => e.TokenId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
            entity.HasIndex(e => e.Token).IsUnique();

            entity.Property(e => e.ReplacedByToken).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // =====================
        // AUTH AUDIT LOG CONFIGURATION
        // =====================
        modelBuilder.Entity<AuthAuditLog>(entity =>
        {
            entity.HasKey(e => e.LogId);
            entity.Property(e => e.LogId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(e => e.User)
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // =====================
        // EXTERNAL LOGIN CONFIGURATION
        // =====================
        modelBuilder.Entity<ExternalLogin>(entity =>
        {
            entity.HasKey(e => e.ExternalLoginId);
            entity.Property(e => e.ExternalLoginId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.Provider).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ProviderKey).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ProviderDisplayName).HasMaxLength(200);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            // Composite unique index — one Google account → one ArenaOps user
            entity.HasIndex(e => new { e.Provider, e.ProviderKey }).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany(u => u.ExternalLogins)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // =====================
        // EVENT MANAGER DETAILS CONFIGURATION
        // =====================
        modelBuilder.Entity<EventManagerDetails>(entity =>
        {
            entity.HasKey(e => e.EventManagerDetailsId);
            entity.Property(e => e.EventManagerDetailsId).HasDefaultValueSql("NEWSEQUENTIALID()");

            entity.Property(e => e.OrganizationName).HasMaxLength(200);
            entity.Property(e => e.GstNumber).HasMaxLength(20);
            entity.Property(e => e.Designation).HasMaxLength(100);
            entity.Property(e => e.Website).HasMaxLength(300);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            // One user → one EventManagerDetails record
            entity.HasIndex(e => e.UserId).IsUnique();

            entity.HasOne(e => e.User)
                .WithOne(u => u.EventManagerDetails)
                .HasForeignKey<EventManagerDetails>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
