import { SeatMapContainer } from "@/components/seat-map/SeatMapContainer";
import { buildDirectionalStadiumLayout } from "@/components/seat-map/stadiumLayout.config";
import { coreService } from "@/services/coreService";
import type { SeatingPlanLayout } from "@/components/seat-map/types";

type Props = {
  params: {
    eventId: string;
  };
};

export default async function EventBookingPage({ params }: Props) {
  const { eventId } = await params;

  let layout: SeatingPlanLayout = buildDirectionalStadiumLayout(); // Default mock layout

  try {
    const layoutResponse = await coreService.getEventLayout(eventId);
    if (layoutResponse.data) {
      // The EventLayout from backend has a different structure, cast it for now
      // TODO: Align backend EventLayout with frontend SeatingPlanLayout structure
      layout = layoutResponse.data as any as SeatingPlanLayout;
    }
  } catch (error) {
    console.error("Failed to load event layout, using mock:", error);
    // Fall back to mock layout
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Select Your Seats
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Event ID: {eventId}</p>
      </div>

      <div className="seat-map-shell rounded-lg border p-6">
        <SeatMapContainer layout={layout} />
      </div>
    </div>
  );
}