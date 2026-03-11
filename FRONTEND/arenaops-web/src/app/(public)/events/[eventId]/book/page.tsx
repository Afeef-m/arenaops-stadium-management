import { SeatMapContainer } from "@/components/seat-map/SeatMapContainer";
import { buildDirectionalStadiumLayout } from "@/components/seat-map/stadiumLayout.config";

const mockLayout = buildDirectionalStadiumLayout();

type Props = {
  params: {
    eventId: string;
  };
};

export default async function EventBookingPage({ params }: Props) {
  const { eventId } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Select Your Seats
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Event ID: {eventId}</p>
      </div>

      <div className="seat-map-shell rounded-lg border p-6">
        <SeatMapContainer layout={mockLayout} />
      </div>
    </div>
  );
}