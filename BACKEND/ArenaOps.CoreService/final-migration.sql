IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219082748_InitialCoreSchema'
)
BEGIN
    CREATE TABLE [Stadiums] (
        [StadiumId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [OwnerId] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Address] nvarchar(300) NOT NULL,
        [City] nvarchar(100) NOT NULL,
        [State] nvarchar(100) NOT NULL,
        [Country] nvarchar(100) NOT NULL,
        [Pincode] nvarchar(10) NOT NULL,
        [Latitude] decimal(9,6) NOT NULL,
        [Longitude] decimal(9,6) NOT NULL,
        [IsApproved] bit NOT NULL DEFAULT CAST(0 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_Stadiums] PRIMARY KEY ([StadiumId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219082748_InitialCoreSchema'
)
BEGIN
    CREATE TABLE [SeatingPlans] (
        [SeatingPlanId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [StadiumId] uniqueidentifier NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_SeatingPlans] PRIMARY KEY ([SeatingPlanId]),
        CONSTRAINT [FK_SeatingPlans_Stadiums_StadiumId] FOREIGN KEY ([StadiumId]) REFERENCES [Stadiums] ([StadiumId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219082748_InitialCoreSchema'
)
BEGIN
    CREATE TABLE [Landmarks] (
        [FeatureId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [SeatingPlanId] uniqueidentifier NOT NULL,
        [Type] nvarchar(50) NOT NULL,
        [Label] nvarchar(100) NULL,
        [PosX] float NOT NULL,
        [PosY] float NOT NULL,
        [Width] float NOT NULL,
        [Height] float NOT NULL,
        CONSTRAINT [PK_Landmarks] PRIMARY KEY ([FeatureId]),
        CONSTRAINT [FK_Landmarks_SeatingPlans_SeatingPlanId] FOREIGN KEY ([SeatingPlanId]) REFERENCES [SeatingPlans] ([SeatingPlanId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219082748_InitialCoreSchema'
)
BEGIN
    CREATE TABLE [Sections] (
        [SectionId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [SeatingPlanId] uniqueidentifier NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Type] nvarchar(20) NOT NULL,
        [Capacity] int NOT NULL,
        [SeatType] nvarchar(50) NULL,
        [Color] nvarchar(20) NULL,
        [PosX] float NOT NULL,
        [PosY] float NOT NULL,
        CONSTRAINT [PK_Sections] PRIMARY KEY ([SectionId]),
        CONSTRAINT [FK_Sections_SeatingPlans_SeatingPlanId] FOREIGN KEY ([SeatingPlanId]) REFERENCES [SeatingPlans] ([SeatingPlanId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219082748_InitialCoreSchema'
)
BEGIN
    CREATE TABLE [Seats] (
        [SeatId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [SectionId] uniqueidentifier NOT NULL,
        [RowLabel] nvarchar(5) NULL,
        [SeatNumber] int NOT NULL,
        [SeatLabel] nvarchar(10) NULL,
        [PosX] float NOT NULL,
        [PosY] float NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [IsAccessible] bit NOT NULL DEFAULT CAST(0 AS bit),
        CONSTRAINT [PK_Seats] PRIMARY KEY ([SeatId]),
        CONSTRAINT [FK_Seats_Sections_SectionId] FOREIGN KEY ([SectionId]) REFERENCES [Sections] ([SectionId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219082748_InitialCoreSchema'
)
BEGIN
    CREATE INDEX [IX_Landmarks_SeatingPlanId] ON [Landmarks] ([SeatingPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219082748_InitialCoreSchema'
)
BEGIN
    CREATE INDEX [IX_SeatingPlans_StadiumId] ON [SeatingPlans] ([StadiumId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219082748_InitialCoreSchema'
)
BEGIN
    CREATE INDEX [IX_Seats_SectionId] ON [Seats] ([SectionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219082748_InitialCoreSchema'
)
BEGIN
    CREATE INDEX [IX_Sections_SeatingPlanId] ON [Sections] ([SeatingPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219082748_InitialCoreSchema'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260219082748_InitialCoreSchema', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303095058_SyncEventEntity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260303095058_SyncEventEntity', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    CREATE TABLE [EventSeatingPlans] (
        [EventSeatingPlanId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventId] uniqueidentifier NOT NULL,
        [SourceSeatingPlanId] uniqueidentifier NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [IsLocked] bit NOT NULL DEFAULT CAST(0 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_EventSeatingPlans] PRIMARY KEY ([EventSeatingPlanId]),
        CONSTRAINT [FK_EventSeatingPlans_SeatingPlans_SourceSeatingPlanId] FOREIGN KEY ([SourceSeatingPlanId]) REFERENCES [SeatingPlans] ([SeatingPlanId]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    CREATE TABLE [EventLandmarks] (
        [EventLandmarkId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventSeatingPlanId] uniqueidentifier NOT NULL,
        [SourceFeatureId] uniqueidentifier NULL,
        [Type] nvarchar(50) NOT NULL,
        [Label] nvarchar(100) NULL,
        [PosX] float NOT NULL,
        [PosY] float NOT NULL,
        [Width] float NOT NULL,
        [Height] float NOT NULL,
        CONSTRAINT [PK_EventLandmarks] PRIMARY KEY ([EventLandmarkId]),
        CONSTRAINT [FK_EventLandmarks_EventSeatingPlans_EventSeatingPlanId] FOREIGN KEY ([EventSeatingPlanId]) REFERENCES [EventSeatingPlans] ([EventSeatingPlanId]) ON DELETE CASCADE,
        CONSTRAINT [FK_EventLandmarks_Landmarks_SourceFeatureId] FOREIGN KEY ([SourceFeatureId]) REFERENCES [Landmarks] ([FeatureId]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    CREATE TABLE [EventSections] (
        [EventSectionId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventSeatingPlanId] uniqueidentifier NOT NULL,
        [SourceSectionId] uniqueidentifier NULL,
        [Name] nvarchar(100) NOT NULL,
        [Type] nvarchar(20) NOT NULL,
        [Capacity] int NOT NULL,
        [SeatType] nvarchar(50) NULL,
        [Color] nvarchar(20) NULL,
        [PosX] float NOT NULL,
        [PosY] float NOT NULL,
        CONSTRAINT [PK_EventSections] PRIMARY KEY ([EventSectionId]),
        CONSTRAINT [FK_EventSections_EventSeatingPlans_EventSeatingPlanId] FOREIGN KEY ([EventSeatingPlanId]) REFERENCES [EventSeatingPlans] ([EventSeatingPlanId]) ON DELETE CASCADE,
        CONSTRAINT [FK_EventSections_Sections_SourceSectionId] FOREIGN KEY ([SourceSectionId]) REFERENCES [Sections] ([SectionId]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    CREATE INDEX [IX_Stadiums_City] ON [Stadiums] ([City]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    CREATE INDEX [IX_Stadiums_OwnerId] ON [Stadiums] ([OwnerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    CREATE INDEX [IX_Seats_RowLabel] ON [Seats] ([RowLabel]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    CREATE INDEX [IX_EventLandmarks_EventSeatingPlanId] ON [EventLandmarks] ([EventSeatingPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    CREATE INDEX [IX_EventLandmarks_SourceFeatureId] ON [EventLandmarks] ([SourceFeatureId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    CREATE INDEX [IX_EventSeatingPlans_EventId] ON [EventSeatingPlans] ([EventId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    CREATE INDEX [IX_EventSeatingPlans_SourceSeatingPlanId] ON [EventSeatingPlans] ([SourceSeatingPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    CREATE INDEX [IX_EventSections_EventSeatingPlanId] ON [EventSections] ([EventSeatingPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    CREATE INDEX [IX_EventSections_SourceSectionId] ON [EventSections] ([SourceSectionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303110948_AddEventLayoutTables'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260303110948_AddEventLayoutTables', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE TABLE [EventSeatingPlans] (
        [EventSeatingPlanId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventId] uniqueidentifier NOT NULL,
        [SourceSeatingPlanId] uniqueidentifier NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [IsLocked] bit NOT NULL DEFAULT CAST(0 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_EventSeatingPlans] PRIMARY KEY ([EventSeatingPlanId]),
        CONSTRAINT [FK_EventSeatingPlans_SeatingPlans_SourceSeatingPlanId] FOREIGN KEY ([SourceSeatingPlanId]) REFERENCES [SeatingPlans] ([SeatingPlanId]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE TABLE [TicketTypes] (
        [TicketTypeId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventId] uniqueidentifier NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [SalePLU] nvarchar(50) NULL,
        [Price] decimal(10,2) NOT NULL,
        CONSTRAINT [PK_TicketTypes] PRIMARY KEY ([TicketTypeId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE TABLE [EventLandmarks] (
        [EventLandmarkId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventSeatingPlanId] uniqueidentifier NOT NULL,
        [SourceFeatureId] uniqueidentifier NULL,
        [Type] nvarchar(50) NOT NULL,
        [Label] nvarchar(100) NULL,
        [PosX] float NOT NULL,
        [PosY] float NOT NULL,
        [Width] float NOT NULL,
        [Height] float NOT NULL,
        CONSTRAINT [PK_EventLandmarks] PRIMARY KEY ([EventLandmarkId]),
        CONSTRAINT [FK_EventLandmarks_EventSeatingPlans_EventSeatingPlanId] FOREIGN KEY ([EventSeatingPlanId]) REFERENCES [EventSeatingPlans] ([EventSeatingPlanId]) ON DELETE CASCADE,
        CONSTRAINT [FK_EventLandmarks_Landmarks_SourceFeatureId] FOREIGN KEY ([SourceFeatureId]) REFERENCES [Landmarks] ([FeatureId]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE TABLE [EventSections] (
        [EventSectionId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventSeatingPlanId] uniqueidentifier NOT NULL,
        [SourceSectionId] uniqueidentifier NULL,
        [Name] nvarchar(100) NOT NULL,
        [Type] nvarchar(20) NOT NULL,
        [Capacity] int NOT NULL,
        [SeatType] nvarchar(50) NULL,
        [Color] nvarchar(20) NULL,
        [PosX] float NOT NULL,
        [PosY] float NOT NULL,
        CONSTRAINT [PK_EventSections] PRIMARY KEY ([EventSectionId]),
        CONSTRAINT [FK_EventSections_EventSeatingPlans_EventSeatingPlanId] FOREIGN KEY ([EventSeatingPlanId]) REFERENCES [EventSeatingPlans] ([EventSeatingPlanId]) ON DELETE CASCADE,
        CONSTRAINT [FK_EventSections_Sections_SourceSectionId] FOREIGN KEY ([SourceSectionId]) REFERENCES [Sections] ([SectionId]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE INDEX [IX_Stadiums_City] ON [Stadiums] ([City]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE INDEX [IX_Stadiums_OwnerId] ON [Stadiums] ([OwnerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE INDEX [IX_Seats_RowLabel] ON [Seats] ([RowLabel]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE INDEX [IX_EventLandmarks_EventSeatingPlanId] ON [EventLandmarks] ([EventSeatingPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE INDEX [IX_EventLandmarks_SourceFeatureId] ON [EventLandmarks] ([SourceFeatureId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE INDEX [IX_EventSeatingPlans_EventId] ON [EventSeatingPlans] ([EventId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE INDEX [IX_EventSeatingPlans_SourceSeatingPlanId] ON [EventSeatingPlans] ([SourceSeatingPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE INDEX [IX_EventSections_EventSeatingPlanId] ON [EventSections] ([EventSeatingPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE INDEX [IX_EventSections_SourceSectionId] ON [EventSections] ([SourceSectionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    CREATE INDEX [IX_TicketTypes_EventId] ON [TicketTypes] ([EventId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303111810_AddTicketType'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260303111810_AddTicketType', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304045032_MergeSync'
)
BEGIN
    CREATE TABLE [EventSeatingPlans] (
        [EventSeatingPlanId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventId] uniqueidentifier NOT NULL,
        [SourceSeatingPlanId] uniqueidentifier NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [IsLocked] bit NOT NULL DEFAULT CAST(0 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_EventSeatingPlans] PRIMARY KEY ([EventSeatingPlanId]),
        CONSTRAINT [FK_EventSeatingPlans_SeatingPlans_SourceSeatingPlanId] FOREIGN KEY ([SourceSeatingPlanId]) REFERENCES [SeatingPlans] ([SeatingPlanId]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304045032_MergeSync'
)
BEGIN
    CREATE TABLE [TicketTypes] (
        [TicketTypeId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventId] uniqueidentifier NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [SalePLU] nvarchar(50) NULL,
        [Price] decimal(10,2) NOT NULL,
        CONSTRAINT [PK_TicketTypes] PRIMARY KEY ([TicketTypeId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304045032_MergeSync'
)
BEGIN
    CREATE TABLE [EventLandmarks] (
        [EventLandmarkId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventSeatingPlanId] uniqueidentifier NOT NULL,
        [SourceFeatureId] uniqueidentifier NULL,
        [Type] nvarchar(50) NOT NULL,
        [Label] nvarchar(100) NULL,
        [PosX] float NOT NULL,
        [PosY] float NOT NULL,
        [Width] float NOT NULL,
        [Height] float NOT NULL,
        CONSTRAINT [PK_EventLandmarks] PRIMARY KEY ([EventLandmarkId]),
        CONSTRAINT [FK_EventLandmarks_EventSeatingPlans_EventSeatingPlanId] FOREIGN KEY ([EventSeatingPlanId]) REFERENCES [EventSeatingPlans] ([EventSeatingPlanId]) ON DELETE CASCADE,
        CONSTRAINT [FK_EventLandmarks_Landmarks_SourceFeatureId] FOREIGN KEY ([SourceFeatureId]) REFERENCES [Landmarks] ([FeatureId]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304045032_MergeSync'
)
BEGIN
    CREATE TABLE [EventSections] (
        [EventSectionId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventSeatingPlanId] uniqueidentifier NOT NULL,
        [SourceSectionId] uniqueidentifier NULL,
        [Name] nvarchar(100) NOT NULL,
        [Type] nvarchar(20) NOT NULL,
        [Capacity] int NOT NULL,
        [SeatType] nvarchar(50) NULL,
        [Color] nvarchar(20) NULL,
        [PosX] float NOT NULL,
        [PosY] float NOT NULL,
        CONSTRAINT [PK_EventSections] PRIMARY KEY ([EventSectionId]),
        CONSTRAINT [FK_EventSections_EventSeatingPlans_EventSeatingPlanId] FOREIGN KEY ([EventSeatingPlanId]) REFERENCES [EventSeatingPlans] ([EventSeatingPlanId]) ON DELETE CASCADE,
        CONSTRAINT [FK_EventSections_Sections_SourceSectionId] FOREIGN KEY ([SourceSectionId]) REFERENCES [Sections] ([SectionId]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304045032_MergeSync'
)
BEGIN
    CREATE INDEX [IX_EventLandmarks_EventSeatingPlanId] ON [EventLandmarks] ([EventSeatingPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304045032_MergeSync'
)
BEGIN
    CREATE INDEX [IX_EventLandmarks_SourceFeatureId] ON [EventLandmarks] ([SourceFeatureId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304045032_MergeSync'
)
BEGIN
    CREATE INDEX [IX_EventSeatingPlans_EventId] ON [EventSeatingPlans] ([EventId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304045032_MergeSync'
)
BEGIN
    CREATE INDEX [IX_EventSeatingPlans_SourceSeatingPlanId] ON [EventSeatingPlans] ([SourceSeatingPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304045032_MergeSync'
)
BEGIN
    CREATE INDEX [IX_EventSections_EventSeatingPlanId] ON [EventSections] ([EventSeatingPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304045032_MergeSync'
)
BEGIN
    CREATE INDEX [IX_EventSections_SourceSectionId] ON [EventSections] ([SourceSectionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304045032_MergeSync'
)
BEGIN
    CREATE INDEX [IX_TicketTypes_EventId] ON [TicketTypes] ([EventId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304045032_MergeSync'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260304045032_MergeSync', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304061124_AddOrganizerProfile'
)
BEGIN
    CREATE TABLE [OrganizerProfiles] (
        [OrganizerProfileId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [OrganizerId] uniqueidentifier NOT NULL,
        [OrganizationName] nvarchar(200) NULL,
        [GstNumber] nvarchar(20) NULL,
        [Designation] nvarchar(100) NULL,
        [Website] nvarchar(300) NULL,
        [PhoneNumber] nvarchar(20) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_OrganizerProfiles] PRIMARY KEY ([OrganizerProfileId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304061124_AddOrganizerProfile'
)
BEGIN
    CREATE UNIQUE INDEX [IX_OrganizerProfiles_OrganizerId] ON [OrganizerProfiles] ([OrganizerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304061124_AddOrganizerProfile'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260304061124_AddOrganizerProfile', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304061125_AddEventSlotAndSectionTicketType'
)
BEGIN
    CREATE TABLE [EventSlots] (
        [EventSlotId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventId] uniqueidentifier NOT NULL,
        [StartTime] datetime2 NOT NULL,
        [EndTime] datetime2 NOT NULL,
        CONSTRAINT [PK_EventSlots] PRIMARY KEY ([EventSlotId]),
        CONSTRAINT [FK_EventSlots_Events_EventId] FOREIGN KEY ([EventId]) REFERENCES [Events] ([EventId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304061125_AddEventSlotAndSectionTicketType'
)
BEGIN
    CREATE TABLE [SectionTicketTypes] (
        [EventSectionId] uniqueidentifier NOT NULL,
        [TicketTypeId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_SectionTicketTypes] PRIMARY KEY ([EventSectionId], [TicketTypeId]),
        CONSTRAINT [FK_SectionTicketTypes_EventSections_EventSectionId] FOREIGN KEY ([EventSectionId]) REFERENCES [EventSections] ([EventSectionId]) ON DELETE CASCADE,
        CONSTRAINT [FK_SectionTicketTypes_TicketTypes_TicketTypeId] FOREIGN KEY ([TicketTypeId]) REFERENCES [TicketTypes] ([TicketTypeId]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304061125_AddEventSlotAndSectionTicketType'
)
BEGIN
    CREATE INDEX [IX_EventSlots_EventId] ON [EventSlots] ([EventId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304061125_AddEventSlotAndSectionTicketType'
)
BEGIN
    CREATE INDEX [IX_SectionTicketTypes_TicketTypeId] ON [SectionTicketTypes] ([TicketTypeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304061125_AddEventSlotAndSectionTicketType'
)
BEGIN
    ALTER TABLE [TicketTypes] ADD CONSTRAINT [FK_TicketTypes_Events_EventId] FOREIGN KEY ([EventId]) REFERENCES [Events] ([EventId]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304061125_AddEventSlotAndSectionTicketType'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260304061125_AddEventSlotAndSectionTicketType', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309065852_RemoveObsoleteEventColumns'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260309065852_RemoveObsoleteEventColumns', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309091340_ARENA-77_AddPriceToSeat'
)
BEGIN
    ALTER TABLE [Seats] ADD [Price] decimal(10,2) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309091340_ARENA-77_AddPriceToSeat'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260309091340_ARENA-77_AddPriceToSeat', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309101913_ARENA-78_AddEventSeatsTable'
)
BEGIN
    CREATE TABLE [EventSeats] (
        [EventSeatId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [EventSectionId] uniqueidentifier NOT NULL,
        [SourceSeatId] uniqueidentifier NULL,
        [RowLabel] nvarchar(5) NULL,
        [SeatNumber] int NOT NULL,
        [SeatLabel] nvarchar(20) NULL,
        [PosX] float NOT NULL,
        [PosY] float NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [IsAccessible] bit NOT NULL DEFAULT CAST(0 AS bit),
        [Price] decimal(10,2) NULL,
        [Status] nvarchar(20) NOT NULL DEFAULT N'Available',
        CONSTRAINT [PK_EventSeats] PRIMARY KEY ([EventSeatId]),
        CONSTRAINT [FK_EventSeats_EventSections_EventSectionId] FOREIGN KEY ([EventSectionId]) REFERENCES [EventSections] ([EventSectionId]) ON DELETE CASCADE,
        CONSTRAINT [FK_EventSeats_Seats_SourceSeatId] FOREIGN KEY ([SourceSeatId]) REFERENCES [Seats] ([SeatId]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309101913_ARENA-78_AddEventSeatsTable'
)
BEGIN
    CREATE INDEX [IX_EventSeats_EventSectionId] ON [EventSeats] ([EventSectionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309101913_ARENA-78_AddEventSeatsTable'
)
BEGIN
    CREATE INDEX [IX_EventSeats_SourceSeatId] ON [EventSeats] ([SourceSeatId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309101913_ARENA-78_AddEventSeatsTable'
)
BEGIN
    CREATE INDEX [IX_EventSeats_Status] ON [EventSeats] ([Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309101913_ARENA-78_AddEventSeatsTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260309101913_ARENA-78_AddEventSeatsTable', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310051634_ARENA-78_AddMissingEventSeatColumns'
)
BEGIN
    DROP INDEX [IX_EventSeats_Status] ON [EventSeats];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310051634_ARENA-78_AddMissingEventSeatColumns'
)
BEGIN
    ALTER TABLE [EventSeats] ADD [EventId] uniqueidentifier NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310051634_ARENA-78_AddMissingEventSeatColumns'
)
BEGIN
    ALTER TABLE [EventSeats] ADD [LockedByUserId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310051634_ARENA-78_AddMissingEventSeatColumns'
)
BEGIN
    ALTER TABLE [EventSeats] ADD [LockedUntil] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310051634_ARENA-78_AddMissingEventSeatColumns'
)
BEGIN
    ALTER TABLE [EventSeats] ADD [SectionType] nvarchar(20) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310051634_ARENA-78_AddMissingEventSeatColumns'
)
BEGIN
    CREATE INDEX [IX_EventSeats_EventId] ON [EventSeats] ([EventId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310051634_ARENA-78_AddMissingEventSeatColumns'
)
BEGIN
    CREATE INDEX [IX_EventSeats_EventId_Status] ON [EventSeats] ([EventId], [Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310051634_ARENA-78_AddMissingEventSeatColumns'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_EventSeats_LockedUntil] ON [EventSeats] ([LockedUntil]) WHERE [Status] = ''Held''');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310051634_ARENA-78_AddMissingEventSeatColumns'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260310051634_ARENA-78_AddMissingEventSeatColumns', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260313120000_ARENA-84_DropObsoleteEventColumns'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Events]') AND [c].[name] = N'StartTime');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Events] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [Events] DROP COLUMN [StartTime];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260313120000_ARENA-84_DropObsoleteEventColumns'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Events]') AND [c].[name] = N'IsLive');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Events] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [Events] DROP COLUMN [IsLive];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260313120000_ARENA-84_DropObsoleteEventColumns'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260313120000_ARENA-84_DropObsoleteEventColumns', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260323174042_AddAdminActivities'
)
BEGIN
    DROP TABLE [EventManagerProfiles];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260323174042_AddAdminActivities'
)
BEGIN
    CREATE TABLE [AdminActivities] (
        [Id] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [ActivityType] nvarchar(50) NOT NULL,
        [Description] nvarchar(500) NOT NULL,
        [EntityId] nvarchar(100) NULL,
        [EntityType] nvarchar(50) NULL,
        [UserId] uniqueidentifier NULL,
        [UserName] nvarchar(200) NULL,
        [UserEmail] nvarchar(256) NULL,
        [Timestamp] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [Metadata] nvarchar(2000) NULL,
        CONSTRAINT [PK_AdminActivities] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260323174042_AddAdminActivities'
)
BEGIN
    CREATE INDEX [IX_AdminActivities_ActivityType] ON [AdminActivities] ([ActivityType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260323174042_AddAdminActivities'
)
BEGIN
    CREATE INDEX [IX_AdminActivities_Timestamp] ON [AdminActivities] ([Timestamp]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260323174042_AddAdminActivities'
)
BEGIN
    CREATE INDEX [IX_AdminActivities_UserId] ON [AdminActivities] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260323174042_AddAdminActivities'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260323174042_AddAdminActivities', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260324081108_AddStadiumImageFields'
)
BEGIN
    ALTER TABLE [Stadiums] ADD [ImagePublicId] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260324081108_AddStadiumImageFields'
)
BEGIN
    ALTER TABLE [Stadiums] ADD [ImageUrl] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260324081108_AddStadiumImageFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260324081108_AddStadiumImageFields', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    ALTER TABLE [Sections] ADD [BowlId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    ALTER TABLE [Sections] ADD [GeometryData] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    ALTER TABLE [Sections] ADD [GeometryType] nvarchar(20) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    ALTER TABLE [Sections] ADD [HorizontalAisles] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    ALTER TABLE [Sections] ADD [Rows] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    ALTER TABLE [Sections] ADD [SeatsPerRow] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    ALTER TABLE [Sections] ADD [VerticalAisles] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    ALTER TABLE [Seats] ADD [RowNumber] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    ALTER TABLE [Seats] ADD [SeatIndexInRow] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    ALTER TABLE [SeatingPlans] ADD [FieldConfigMetadata] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    ALTER TABLE [SeatingPlans] ADD [TotalCapacity] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    CREATE TABLE [Bowls] (
        [BowlId] uniqueidentifier NOT NULL DEFAULT (NEWSEQUENTIALID()),
        [SeatingPlanId] uniqueidentifier NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Color] nvarchar(20) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_Bowls] PRIMARY KEY ([BowlId]),
        CONSTRAINT [FK_Bowls_SeatingPlans_SeatingPlanId] FOREIGN KEY ([SeatingPlanId]) REFERENCES [SeatingPlans] ([SeatingPlanId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    CREATE INDEX [IX_Sections_BowlId] ON [Sections] ([BowlId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    CREATE INDEX [IX_Bowls_DisplayOrder] ON [Bowls] ([DisplayOrder]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    CREATE INDEX [IX_Bowls_SeatingPlanId] ON [Bowls] ([SeatingPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    ALTER TABLE [Sections] ADD CONSTRAINT [FK_Sections_Bowls_BowlId] FOREIGN KEY ([BowlId]) REFERENCES [Bowls] ([BowlId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330104131_AddStadiumLayoutBuilderSupport'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260330104131_AddStadiumLayoutBuilderSupport', N'8.0.12');
END;
GO

COMMIT;
GO

