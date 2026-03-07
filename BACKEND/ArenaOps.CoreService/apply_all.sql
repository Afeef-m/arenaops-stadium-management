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

