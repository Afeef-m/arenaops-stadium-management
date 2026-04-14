import Link from "next/link";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import Image from "next/image";
import { coreService } from "@/services/coreService";

type Props = {
  params: {
    eventId: string;
  };
};

export async function generateMetadata({ params }: Props) {
  const { eventId } = await params;

  try {
    const response = await coreService.getEvent(eventId);
    const event = response.data;
    return {
      title: `${event?.name || 'Event'} | ArenaOps`,
      description: event?.description || `Details for event`,
    };
  } catch {
    return {
      title: `Event ${eventId} | ArenaOps`,
      description: `Details for event ${eventId}`,
    };
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { eventId } = await params;

  let event: any = null;
  let slots: any[] = [];

  try {
    const eventResponse = await coreService.getEvent(eventId);
    event = eventResponse.data;

    const slotsResponse = await coreService.getEventSlots(eventId);
    slots = slotsResponse.data || [];
  } catch (error) {
    console.error("Failed to load event:", error);
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">The event you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/events" className="text-primary hover:underline">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const firstSlot = slots[0];
  const startDate = firstSlot?.startTime ? new Date(firstSlot.startTime) : null;

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">

      {/* HERO SECTION */}
      <div className="relative h-[320px] w-full overflow-hidden">
        <Image
          src={event.imageUrl || "https://images.unsplash.com/photo-1506157786151-b8491531f063"}
          alt={event.name}
          fill
          priority
          className="object-cover brightness-75"
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative container mx-auto px-6 py-16 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {event.name}
          </h1>
          <p className="text-lg text-gray-200">
            {event.description || `Event ID: ${eventId}`}
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
                  <p className="font-semibold">
                    {startDate ? startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted transition-colors">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-semibold">
                    {firstSlot?.startTime ? new Date(firstSlot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted transition-colors">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-semibold">{event.stadiumName || 'Arena'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted transition-colors">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-semibold">{event.status === 'Live' ? 'Live Event' : 'Event'}</p>
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
              {event.description || 'No description available for this event. Check back for more information.'}
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

            {/* Status */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
              <p className="font-semibold capitalize">{event.status || 'Live'}</p>
            </div>

            {/* CTA Button */}
            {event.status === 'Live' ? (
              <Link
                href={`/events/${eventId}/book`}
                className="block w-full text-center py-3 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                Book Tickets
              </Link>
            ) : (
              <button
                disabled
                className="block w-full text-center py-3 bg-muted text-muted-foreground font-semibold rounded-[var(--radius-md)] cursor-not-allowed"
              >
                Coming Soon
              </button>
            )}

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
