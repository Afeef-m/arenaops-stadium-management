//src\app\(public)\page.tsx
import { HeroSection } from "@/components/landing/HeroSection";
import { EventDiscovery } from "@/components/landing/EventDiscovery";
import { Event } from "@/types/event";

export default function Home() {
  const events: Event[] = [];

  return (
    <main className="min-h-screen bg-background dark text-foreground">

      <HeroSection />
      <EventDiscovery events={events} />
    </main>
  );
}