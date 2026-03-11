import { EventDiscovery } from "@/components/landing/EventDiscovery";
import { Event } from "@/types/event";

export default async function EventsPage() {
  const events: Event[] = []; 

  return <EventDiscovery events={events} />;
}