"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, Skeleton } from "@/components/ui";
import { useActivities } from "@/features/admin/hooks/useAdmin";
import type { ActivityFilterRequest } from "@/features/admin/types/admin.types";
import {
  Activity,
  Users,
  Building2,
  Calendar,
  Ticket,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const activityTypes = [
  { value: "", label: "All Activities" },
  { value: "UserRegistered", label: "User Registered" },
  { value: "UserActivated", label: "User Activated" },
  { value: "UserDeactivated", label: "User Deactivated" },
  { value: "StadiumCreated", label: "Stadium Created" },
  { value: "StadiumApproved", label: "Stadium Approved" },
  { value: "StadiumRejected", label: "Stadium Rejected" },
  { value: "EventCreated", label: "Event Created" },
  { value: "EventPublished", label: "Event Published" },
  { value: "BookingCreated", label: "Booking Created" },
  { value: "BookingConfirmed", label: "Booking Confirmed" },
];

export default function ActivityLogsPage() {
  const [filter, setFilter] = useState<ActivityFilterRequest>({
    page: 1,
    pageSize: 20,
  });

  const activities = useActivities(filter);

  const getActivityIcon = (type: string) => {
    if (type.includes("User")) return <Users className="w-4 h-4" />;
    if (type.includes("Stadium")) return <Building2 className="w-4 h-4" />;
    if (type.includes("Event")) return <Calendar className="w-4 h-4" />;
    if (type.includes("Booking")) return <Ticket className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActivityColor = (type: string) => {
    if (type.includes("User")) return "bg-blue-100 text-blue-600";
    if (type.includes("Stadium")) return "bg-purple-100 text-purple-600";
    if (type.includes("Event")) return "bg-orange-100 text-orange-600";
    if (type.includes("Booking")) return "bg-green-100 text-green-600";
    return "bg-gray-100 text-gray-600";
  };

  const handleFilterChange = (key: keyof ActivityFilterRequest, value: string | number) => {
    setFilter((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: key !== "page" ? 1 : (value as number),
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
          <p className="text-sm text-slate-500">Track all system activities and events</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => activities.refetch()}
          disabled={activities.isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${activities.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filter.activityType || ""}
                onChange={(e) => handleFilterChange("activityType", e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {activityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">From:</span>
              <input
                type="date"
                value={filter.startDate || ""}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">To:</span>
              <input
                type="date"
                value={filter.endDate || ""}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {(filter.activityType || filter.startDate || filter.endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFilter({
                    page: 1,
                    pageSize: 20,
                  })
                }
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {activities.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <p>Failed to load activity logs</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => activities.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.data?.data?.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No activity logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.data?.data?.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className={`p-3 rounded-lg ${getActivityColor(activity.activityType)}`}>
                    {getActivityIcon(activity.activityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900">{activity.description}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                          {activity.userName && (
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {activity.userName}
                            </span>
                          )}
                          {activity.entityType && (
                            <span className="px-2 py-0.5 bg-slate-200 rounded text-xs">
                              {activity.entityType}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {format(new Date(activity.timestamp), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {activities.data && activities.data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Showing {(activities.data.page - 1) * activities.data.pageSize + 1} to{" "}
                {Math.min(
                  activities.data.page * activities.data.pageSize,
                  activities.data.totalCount
                )}{" "}
                of {activities.data.totalCount} activities
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFilterChange("page", activities.data.page - 1)}
                  disabled={!activities.data.hasPreviousPage}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-600">
                  Page {activities.data.page} of {activities.data.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFilterChange("page", activities.data.page + 1)}
                  disabled={!activities.data.hasNextPage}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
