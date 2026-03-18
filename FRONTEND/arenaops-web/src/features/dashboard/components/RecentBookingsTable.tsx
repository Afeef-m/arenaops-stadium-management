"use client";

import * as React from "react";
import type { RecentBooking } from "../types/dashboard.types";
import { Badge } from "@/components/ui/badge";
import { Button, Skeleton } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  title?: string;
  data: RecentBooking[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  rows?: number;
};

function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin >= 0 && diffMin < 60) {
    return `${diffMin} min ago`;
  }

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const timeLabel = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isSameDay) {
    return `Today ${timeLabel}`;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function StatusBadge({ status }: { status: RecentBooking["status"] }) {
  if (status === "confirmed") {
    return <Badge>Confirmed</Badge>;
  }

  if (status === "cancelled") {
    return <Badge variant="destructive">Cancelled</Badge>;
  }

  return (
    <Badge
      variant="secondary"
      className="bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200"
    >
      Pending
    </Badge>
  );
}

export function RecentBookingsTable({
  title: _title = "Recent bookings",
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  rows = 5,
}: Props) {
  void _title;

  return (
    <div className="space-y-3">
      {isError && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-destructive">
            {errorMessage || "Failed to load recent bookings"}
          </p>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Stadium</TableHead>
            <TableHead className="text-right">Seats</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-10 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              </TableRow>
            ))
          ) : data?.length ? (
            data.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.userName}</TableCell>
                <TableCell>{booking.eventName}</TableCell>
                <TableCell>{booking.stadiumName}</TableCell>
                <TableCell className="text-right">{booking.seats}</TableCell>
                <TableCell>
                  <StatusBadge status={booking.status} />
                </TableCell>
                <TableCell>{formatRelativeTime(booking.createdAt)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-sm text-muted-foreground py-6"
              >
                No recent bookings found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

