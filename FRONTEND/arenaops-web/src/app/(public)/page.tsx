//src\app\(public)\page.tsx
import { HeroSection } from "@/components/landing/HeroSection";
import { EventDiscovery } from "@/components/landing/EventDiscovery";

export default function Home() {
  return (
    <main className="min-h-screen bg-background dark text-foreground">
      <HeroSection />
      <EventDiscovery />
    </main>
  );
}
