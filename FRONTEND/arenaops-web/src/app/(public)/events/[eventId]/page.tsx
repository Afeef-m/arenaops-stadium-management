import Link from "next/link";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import Image from "next/image";

type Props = {
  params: {
    eventId: string;
  };
};

export async function generateMetadata({ params }: Props) {
  const { eventId } = await params;

  return {
    title: `Event ${eventId} | ArenaOps`,
    description: `Details for event ${eventId}`,
  };
}


export default async function EventDetailPage({ params }: Props) {
  const { eventId } = await params;

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">

      {/* HERO SECTION */}
      <div className="relative h-[320px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1506157786151-b8491531f063"
          alt="Event Banner"
          fill
          priority
          className="object-cover brightness-75"
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative container mx-auto px-6 py-16 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Summer Concert 2026
          </h1>
          <p className="text-lg text-gray-200">
            Event ID: {eventId}
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="container mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">

        {/* LEFT - EVENT DETAILS */}
        <div className="md:col-span-2 space-y-8">

          {/* EVENT DETAILS CARD */}
          <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-8 tracking-tight">
              Event Details
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted transition-colors">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">July 15, 2026</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted transition-colors">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-semibold">7:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted transition-colors">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-semibold">Concert Arena</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted transition-colors">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-semibold">5,000 Seats</p>
                </div>
              </div>

            </div>
          </div>


          {/* DESCRIPTION */}
          <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-4 tracking-tight">
              About This Event
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              Experience an unforgettable night of music, lights, and energy at
              Summer Concert 2026. Featuring top artists and an electrifying
              atmosphere, this event promises a world-class entertainment
              experience.
            </p>
          </div>

        </div>

        {/* RIGHT - BOOKING CARD */}
        <div className="sticky top-24 h-fit">
          <div className="bg-card text-card-foreground rounded-var(--radius-lg) shadow-2xl p-8 border border-border space-y-6 relative overflow-hidden">

            {/* Subtle Glow Accent */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            {/* Price Section */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Starting From
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-extrabold text-primary">
                  ₹999
                </h3>
                <span className="text-muted-foreground text-sm">per ticket</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Limited seats available
              </p>
            </div>
            {/* CTA Button */}
            <Link
              href={`/events/${eventId}/book`}
              className="block w-full text-center py-3 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              Book Tickets
            </Link>

            {/* Secondary Button */}
            <Link
              href="/"
              className="block w-full text-center py-3 bg-secondary text-secondary-foreground font-medium rounded-[var(--radius-md)] hover:bg-secondary/80 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
