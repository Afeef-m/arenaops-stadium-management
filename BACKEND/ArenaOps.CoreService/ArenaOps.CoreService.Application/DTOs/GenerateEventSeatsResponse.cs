namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Summary returned by POST /api/events/{id}/generate-seats.
/// Breaks down how many seats were generated per section and section type.
/// </summary>
public class GenerateEventSeatsResponse
{
    /// <summary>Total EventSeat rows inserted into the database.</summary>
    public int TotalSeatsGenerated { get; set; }

    /// <summary>Number of Seated sections that were cloned (SourceSectionId != null).</summary>
    public int SeatedSectionsProcessed { get; set; }

    /// <summary>Number of Standing sections that had capacity slots generated.</summary>
    public int StandingSectionsProcessed { get; set; }

    /// <summary>
    /// Number of sections skipped (custom Seated sections with SourceSectionId = null).
    /// These have no template seats to clone from and cannot be auto-generated.
    /// </summary>
    public int SectionsSkipped { get; set; }

    /// <summary>Per-section breakdown for diagnostics.</summary>
    public List<SectionGenerationSummary> Sections { get; set; } = new();
}

/// <summary>Per-section line in the generation summary.</summary>
public class SectionGenerationSummary
{
    public Guid EventSectionId { get; set; }
    public string SectionName { get; set; } = string.Empty;

    /// <summary>"Seated" or "Standing".</summary>
    public string SectionType { get; set; } = string.Empty;

    /// <summary>Number of EventSeats generated for this section. 0 if skipped.</summary>
    public int SeatsGenerated { get; set; }

    /// <summary>"Generated" | "Skipped" — Skipped for custom Seated sections with no template source.</summary>
    public string Result { get; set; } = string.Empty;
}
