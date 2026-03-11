"use client";

import { BookingProvider } from "@/features/bookings/useBooking";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BookingProvider>{children}</BookingProvider>;
}