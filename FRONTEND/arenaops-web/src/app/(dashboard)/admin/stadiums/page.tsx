"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, Skeleton } from "@/components/ui";
import {
  usePendingStadiums,
  useApproveStadium,
  useRejectStadium,
} from "@/features/admin/hooks/useAdmin";
import type { PendingStadium } from "@/features/admin/types/admin.types";
import {
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Clock,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function StadiumApprovalsPage() {
  const stadiums = usePendingStadiums();
  const approveStadium = useApproveStadium();
  const rejectStadium = useRejectStadium();
  const [selectedStadium, setSelectedStadium] = useState<PendingStadium | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleApprove = async (stadiumId: string) => {
    await approveStadium.mutateAsync(stadiumId);
  };

  const handleReject = async () => {
    if (selectedStadium && rejectReason) {
      await rejectStadium.mutateAsync({
        stadiumId: selectedStadium.stadiumId,
        reason: rejectReason,
      });
      setShowRejectModal(false);
      setSelectedStadium(null);
      setRejectReason("");
    }
  };

  const openRejectModal = (stadium: PendingStadium) => {
    setSelectedStadium(stadium);
    setShowRejectModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stadium Approvals</h1>
          <p className="text-sm text-slate-500">
            Review and approve new stadium registrations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => stadiums.refetch()}
          disabled={stadiums.isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${stadiums.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending Approvals</p>
              <p className="text-3xl font-bold text-slate-900">
                {stadiums.isLoading ? (
                  <Skeleton className="h-9 w-12 inline-block" />
                ) : (
                  stadiums.data?.length ?? 0
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {stadiums.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <p>Failed to load pending stadiums</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => stadiums.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stadium Cards */}
      {stadiums.isLoading ? (
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
      ) : stadiums.data?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
            <p className="text-sm text-slate-500 mt-1">
              There are no stadiums pending approval.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stadiums.data?.map((stadium) => (
            <Card key={stadium.stadiumId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{stadium.name}</CardTitle>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(stadium.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    {stadium.address}, {stadium.city}, {stadium.state}, {stadium.country} -{" "}
                    {stadium.pincode}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Eye className="w-4 h-4" />
                  <span>
                    Coordinates: {stadium.latitude.toFixed(4)}, {stadium.longitude.toFixed(4)}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(stadium.stadiumId)}
                    disabled={approveStadium.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => openRejectModal(stadium)}
                    disabled={rejectStadium.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedStadium && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Reject Stadium</h2>
              <p className="text-sm text-slate-500 mt-1">{selectedStadium.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedStadium(null);
                  setRejectReason("");
                }}
                disabled={rejectStadium.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectStadium.isPending || !rejectReason.trim()}
              >
                {rejectStadium.isPending ? "Rejecting..." : "Reject Stadium"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
