namespace ArenaOps.CoreService.Application.Constants;

public static class CacheKeys
{
    public const string StadiumPrefix = "stadium:";
    public const string StadiumList = "stadiums:list";
    public static string Stadium(Guid id) => $"stadium:{id}";
    public static string StadiumsByCity(string city) => $"stadiums:list:city:{city.ToLowerInvariant()}";
    public static string StadiumsByOwner(Guid ownerId) => $"stadiums:list:owner:{ownerId}";

    public const string SeatingPlanPrefix = "seatingplan:";
    public static string SeatingPlan(Guid id) => $"seatingplan:{id}";
    public static string SeatingPlansByStadium(Guid stadiumId) => $"seatingplans:stadium:{stadiumId}";

    public const string SectionPrefix = "section:";
    public static string Section(Guid id) => $"section:{id}";
    public static string SectionsByPlan(Guid planId) => $"sections:plan:{planId}";

    public const string SeatPrefix = "seat:";
    public static string SeatsBySection(Guid sectionId) => $"seats:section:{sectionId}";

    public const string EventPrefix = "event:";
    public static string Event(Guid id) => $"event:{id}";
    public static string EventLayout(Guid eventId) => $"event:{eventId}:layout";
    public const string EventList = "events:list";
    public static string EventsByStatus(string status) => $"events:list:status:{status.ToLowerInvariant()}";
    public static string EventsByOrganizer(Guid organizerId) => $"events:list:organizer:{organizerId}";
    public static string EventsByStadium(Guid stadiumId) => $"events:list:stadium:{stadiumId}";
}
