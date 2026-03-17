"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, Skeleton } from "@/components/ui";
import { useManagerDashboard } from "@/features/dashboard/hooks/useManagerDashboard";
import { useRecentBookings } from "@/features/dashboard/hooks/useRecentBookings";
import { RecentBookingsTable } from "@/features/dashboard/components/RecentBookingsTable";
import { Building2, CalendarDays, Ticket, Users } from "lucide-react";

export default function ManagerDashboard() {
  const { data, isLoading, isFetching, isError, error, refetch } =
    useManagerDashboard();
  const recentBookingsQuery = useRecentBookings(5);

  const loading = isLoading && !data;
  const updating = isFetching && !!data;

  const stats = [
    {
      key: "totalStadiums",
      label: "Total Stadiums",
      icon: <Building2 size={18} />,
      value: data?.totalStadiums,
    },
    {
      key: "todaysBookings",
      label: "Today's Bookings",
      icon: <CalendarDays size={18} />,
      value: data?.todaysBookings,
    },
    {
      key: "totalUsers",
      label: "Total Users",
      icon: <Users size={18} />,
      value: data?.totalUsers,
    },
    {
      key: "ticketsSold",
      label: "Tickets Sold",
      icon: <Ticket size={18} />,
      value: data?.ticketsSold,
    },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of stadium activity
        </p>
      </div>

      {isError && (
        <Card className="border-destructive/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-destructive">
              Failed to load dashboard metrics
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Section */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              {stat.icon}
            </CardHeader>

            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {(stat.value ?? 0).toLocaleString()}
                </div>
              )}
              {updating && (
                <p className="mt-2 text-xs text-muted-foreground">Updating…</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Optional placeholders */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 rounded-md border border-dashed flex items-center justify-center text-sm text-muted-foreground">
              Chart placeholder
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RecentBookingsTable
              data={recentBookingsQuery.data}
              isLoading={recentBookingsQuery.isLoading}
              isError={recentBookingsQuery.isError}
              errorMessage={
                recentBookingsQuery.error instanceof Error
                  ? recentBookingsQuery.error.message
                  : undefined
              }
              onRetry={() => recentBookingsQuery.refetch()}
              rows={5}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
