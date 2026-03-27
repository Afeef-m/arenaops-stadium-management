"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, Skeleton } from "@/components/ui";
import {
  useEvents,
  useUpdateEventStatus,
  useDeleteEvent,
} from "@/features/admin/hooks/useAdmin";
import type { EventListItem, EventStatus } from "@/features/admin/types/admin.types";
import {
  Calendar,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "", label: "All Events", color: "bg-slate-100 text-slate-700" },
  { value: "Draft", label: "Draft", color: "bg-gray-100 text-gray-700" },
  { value: "PendingApproval", label: "Pending Approval", color: "bg-yellow-100 text-yellow-700" },
  { value: "Live", label: "Live", color: "bg-green-100 text-green-700" },
  { value: "Completed", label: "Completed", color: "bg-blue-100 text-blue-700" },
  { value: "Cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
];

export default function EventsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const events = useEvents(statusFilter || undefined);
  const updateEventStatus = useUpdateEventStatus();
  const deleteEvent = useDeleteEvent();
  const [selectedEvent, setSelectedEvent] = useState<EventListItem | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleStatusChange = async () => {
    if (selectedEvent && newStatus) {
      await updateEventStatus.mutateAsync({
        eventId: selectedEvent.eventId,
        statusData: { status: newStatus },
      });
      setShowStatusModal(false);
      setSelectedEvent(null);
      setNewStatus("");
    }
  };

  const handleDelete = async () => {
    if (selectedEvent) {
      await deleteEvent.mutateAsync(selectedEvent.eventId);
      setShowDeleteModal(false);
      setSelectedEvent(null);
    }
  };

  const openStatusModal = (event: EventListItem) => {
    setSelectedEvent(event);
    setNewStatus(event.status);
    setShowStatusModal(true);
  };

  const openDeleteModal = (event: EventListItem) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status: EventStatus) => {
    const statusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
    return statusOption?.color || "bg-gray-100 text-gray-700";
  };

  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case "Draft":
        return <Edit className="w-4 h-4" />;
      case "PendingApproval":
        return <Clock className="w-4 h-4" />;
      case "Live":
        return <Play className="w-4 h-4" />;
      case "Completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "Cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events Management</h1>
          <p className="text-sm text-slate-500">
            Manage and monitor all events in the system
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => events.refetch()}
          disabled={events.isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${events.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-500" />
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === option.value
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-100 rounded-lg">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">
                {statusFilter ? `${STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label} Events` : "Total Events"}
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {events.isLoading ? (
                  <Skeleton className="h-9 w-12 inline-block" />
                ) : (
                  events.data?.length ?? 0
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {events.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <p>Failed to load events</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => events.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Event Cards */}
      {events.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.data?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900">No events found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {statusFilter
                ? `There are no ${STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label.toLowerCase()} events.`
                : "There are no events in the system."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.data?.map((event) => (
            <Card key={event.eventId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{event.name}</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {getStatusIcon(event.status)}
                    <span>{event.status}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{event.stadiumName}</span>
                </div>

                {event.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {event.imageUrl && (
                  <div className="relative h-32 rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openStatusModal(event)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Status
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => openDeleteModal(event)}
                    disabled={deleteEvent.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Update Event Status</h2>
              <p className="text-sm text-slate-500 mt-1">{selectedEvent.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select New Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.filter((opt) => opt.value !== "").map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setNewStatus(option.value)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all ${
                        newStatus === option.value
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedEvent(null);
                  setNewStatus("");
                }}
                disabled={updateEventStatus.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={updateEventStatus.isPending || !newStatus || newStatus === selectedEvent.status}
              >
                {updateEventStatus.isPending ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Delete Event</h2>
              <p className="text-sm text-slate-500 mt-1">{selectedEvent.name}</p>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">This action cannot be undone</p>
                  <p className="text-sm text-red-700 mt-1">
                    Are you sure you want to delete this event? This will permanently remove the event and all associated data.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedEvent(null);
                }}
                disabled={deleteEvent.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteEvent.isPending}
              >
                {deleteEvent.isPending ? "Deleting..." : "Delete Event"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
