"use client";

import { Calendar, MapPin, Clock } from "lucide-react";
import type { Event } from "@/services/coreService";

interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Draft: { label: "Draft", bg: "bg-gray-500/20", text: "text-gray-300", dot: "bg-gray-400" },
  PendingApproval: { label: "Pending", bg: "bg-amber-500/20", text: "text-amber-300", dot: "bg-amber-400" },
  Approved: { label: "Approved", bg: "bg-blue-500/20", text: "text-blue-300", dot: "bg-blue-400" },
  Live: { label: "Live", bg: "bg-emerald-500/20", text: "text-emerald-300", dot: "bg-emerald-400" },
  Completed: { label: "Completed", bg: "bg-purple-500/20", text: "text-purple-300", dot: "bg-purple-400" },
  Cancelled: { label: "Cancelled", bg: "bg-red-500/20", text: "text-red-300", dot: "bg-red-400" },
};

export default function EventCard({ event, onClick }: EventCardProps) {
  const status = STATUS_CONFIG[event.status] || STATUS_CONFIG.Draft;

  return (
    <button
      onClick={onClick}
      className="group relative text-left w-full rounded-xl border border-white/5 bg-[#111827] overflow-hidden hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5"
    >
      {/* Image or gradient header */}
      <div className="h-32 relative overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600/30 via-blue-600/20 to-purple-600/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.text} backdrop-blur-sm`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${event.status === "Live" ? "animate-pulse" : ""}`} />
            {status.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
          {event.name}
        </h3>

        {event.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          {event.stadiumName && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <MapPin size={12} className="text-gray-600 flex-shrink-0" />
              <span className="truncate">{event.stadiumName}</span>
            </div>
          )}

          {event.createdAt && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar size={12} className="text-gray-600 flex-shrink-0" />
              <span>{new Date(event.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Hover indicator */}
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
          <span>View Details</span>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </button>
  );
}
