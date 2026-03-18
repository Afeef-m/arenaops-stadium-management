import { EventDiscovery } from "@/components/landing/EventDiscovery";
import type { Event } from "@/services/coreService";
import { coreService } from "@/services/coreService";

export default async function EventsPage() {
  let events: Event[] = [];

  try {
    const response = await coreService.getEvents();
    events = response.data || [];
  } catch (error) {
    console.error("Failed to load events:", error);
    // Graceful fallback to empty array
  }

  return <EventDiscovery events={events} />;
}