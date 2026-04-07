"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToastActions } from "@/components/ui/toast";
import { ArrowLeft, MapPin, Clock, Plus, Pencil } from "lucide-react";
import { coreService, Event, EventSlot } from "@/services/coreService";
import EventStatusBadge from "@/components/event-manager/EventStatusBadge";
import ConfirmDialog from "@/components/event-manager/ConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { success, error: showError } = useToastActions();

  // Data state
  const [event, setEvent] = useState<Event | null>(null);
  const [slots, setSlots] = useState<EventSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
    variant: "danger" | "warning" | "info";
  }>({
    open: false,
    title: "",
    message: "",
    action: () => {},
    variant: "info",
  });

  const fetchEventData = useCallback(async () => {
    try {
      const [eventRes, slotsRes] = await Promise.all([
        coreService.getEvent(eventId),
        coreService.getEventSlots(eventId),
      ]);

      if (eventRes.success && eventRes.data) {
        setEvent(eventRes.data);
      } else {
        showError("Event not found");
        router.push("/event-manager/events");
        return;
      }

      if (slotsRes.success && slotsRes.data) {
        setSlots(slotsRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch event", err);
      showError("Failed to load event details");
      router.push("/event-manager/events");
    } finally {
      setLoading(false);
    }
  }, [eventId, showError, router]);

  useEffect(() => {
    fetchEventData();
  }, [eventId, fetchEventData]);

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await coreService.updateEventStatus(eventId, { status: newStatus });
      if (res.success && res.data) {
        setEvent(res.data);
        success(`Event status updated to ${newStatus}`);
      } else {
        showError(res.error?.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Failed to update status", err);
      showError("Failed to update event status");
    } finally {
      setActionLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const openPublishDialog = () => {
    setConfirmDialog({
      open: true,
      title: "Publish Event?",
      message: "This will make your event visible to the public and start accepting bookings. You won't be able to edit basic details after publishing.",
      action: () => handleStatusChange("Live"),
      variant: "info",
    });
  };

  const openCompleteDialog = () => {
    setConfirmDialog({
      open: true,
      title: "Mark as Completed?",
      message: "This will mark your event as completed and close bookings. This action cannot be undone.",
      action: () => handleStatusChange("Completed"),
      variant: "warning",
    });
  };

  const openCancelDialog = () => {
    setConfirmDialog({
      open: true,
      title: "Cancel Event?",
      message: "This will cancel your event and notify all attendees. This action cannot be undone.",
      action: () => handleStatusChange("Cancelled"),
      variant: "danger",
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 bg-white/5" />
          <Skeleton className="h-10 w-64 bg-white/5" />
        </div>
        <Skeleton className="h-64 w-full bg-white/5" />
        <Skeleton className="h-96 w-full bg-white/5" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Event not found</p>
      </div>
    );
  }

  const isDraft = event.status === "Draft";
  const isLive = event.status === "Live";
  const isCompleted = event.status === "Completed";
  const isCancelled = event.status === "Cancelled";
  const isPendingApproval = event.status === "PendingApproval";
  const isApproved = event.status === "Approved";
  const isEditable = isDraft || isPendingApproval;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-white/5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-black italic tracking-tighter text-white mb-1">{event.name}</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Event Management</p>
        </div>
        <EventStatusBadge status={event.status} />
      </div>

      {/* Hero Section */}
      <Card className="bg-[#111827] border-white/5 text-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stadium Info */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#10b981]/10 rounded-lg">
                <MapPin className="w-5 h-5 text-[#10b981]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Stadium</p>
                <p className="text-sm font-semibold text-white">{event.stadiumName || "TBD"}</p>
                <Link
                  href={`/event-manager/stadiums/${event.stadiumId}`}
                  className="text-xs text-[#10b981] hover:underline"
                >
                  View Stadium
                </Link>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#10b981]/10 rounded-lg">
                <Clock className="w-5 h-5 text-[#10b981]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Status</p>
                <EventStatusBadge status={event.status} size="md" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/5">
            {isDraft && (
              <>
                <Button
                  onClick={openPublishDialog}
                  disabled={actionLoading}
                  className="bg-[#10b981] text-black hover:bg-[#10b981]/90 font-bold tracking-widest uppercase text-[10px]"
                >
                  Publish Event
                </Button>
                <Button
                  onClick={() => router.push(`/event-manager/events/${eventId}/edit`)}
                  variant="outline"
                  className="bg-transparent border-white/10 text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Details
                </Button>
              </>
            )}

            {isPendingApproval && (
              <>
                <Button
                  onClick={() => router.push(`/event-manager/events/${eventId}/edit`)}
                  variant="outline"
                  className="bg-transparent border-white/10 text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Details
                </Button>
              </>
            )}

            {isApproved && (
              <>
                <Button
                  onClick={openPublishDialog}
                  disabled={actionLoading}
                  className="bg-[#10b981] text-black hover:bg-[#10b981]/90 font-bold tracking-widest uppercase text-[10px]"
                >
                  Go Live
                </Button>
              </>
            )}

            {isLive && (
              <>
                <Button
                  onClick={openCompleteDialog}
                  disabled={actionLoading}
                  className="bg-blue-500 text-white hover:bg-blue-600 font-bold tracking-widest uppercase text-[10px]"
                >
                  Mark as Completed
                </Button>
              </>
            )}

            {(isDraft || isPendingApproval || isApproved || isLive) && (
              <Button
                onClick={openCancelDialog}
                disabled={actionLoading}
                variant="outline"
                className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
              >
                Cancel Event
              </Button>
            )}

            {(isCompleted || isCancelled) && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-gray-400">
                  {isCompleted
                    ? "This event has been completed and is now read-only."
                    : "This event has been cancelled."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-[#111827] border border-white/5 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#10b981]/20 data-[state=active]:text-[#10b981]">
            Overview
          </TabsTrigger>
          <TabsTrigger value="slots" className="data-[state=active]:bg-[#10b981]/20 data-[state=active]:text-[#10b981]">
            Time Slots
          </TabsTrigger>
          <TabsTrigger value="layout" className="data-[state=active]:bg-[#10b981]/20 data-[state=active]:text-[#10b981]">
            Layout & Seating
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <Card className="bg-[#111827] border-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.description && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Description</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{event.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Created</p>
                  <p className="text-sm text-white">{formatDate(event.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Event ID</p>
                  <p className="text-sm text-white font-mono">{event.eventId}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Slots Tab */}
        <TabsContent value="slots" className="mt-6">
          <Card className="bg-[#111827] border-white/5 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Time Slots</CardTitle>
                  <CardDescription className="text-gray-500 text-xs">
                    Configured showing times for this event
                  </CardDescription>
                </div>
                {isEditable && (
                  <Button
                    onClick={() => router.push(`/event-manager/events/${eventId}/add-slot`)}
                    size="sm"
                    className="bg-[#10b981] text-black hover:bg-[#10b981]/90 font-bold text-[10px] uppercase tracking-widest gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    Add Slot
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {slots.length > 0 ? (
                <div className="space-y-3">
                  {slots.map((slot) => (
                    <div
                      key={slot.slotId}
                      className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <Clock className="w-5 h-5 text-[#10b981]" />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </p>
                          {slot.label && <p className="text-xs text-gray-400 mt-0.5">{slot.label}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No time slots configured yet</p>
                  {isEditable && (
                    <Button
                      onClick={() => router.push(`/event-manager/events/${eventId}/add-slot`)}
                      size="sm"
                      variant="outline"
                      className="mt-4 bg-transparent border-white/10 text-white hover:bg-white/5"
                    >
                      Add First Slot
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout & Seating Tab */}
        <TabsContent value="layout" className="mt-6">
          <Card className="bg-[#111827] border-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Layout & Seating</CardTitle>
              <CardDescription className="text-gray-500 text-xs">
                Seating configuration and seat generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
                <p className="text-xs uppercase tracking-widest font-bold text-gray-500">
                  Layout management coming soon
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Clone stadium seating plan, configure sections, and generate seats
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </div>
  );
}
