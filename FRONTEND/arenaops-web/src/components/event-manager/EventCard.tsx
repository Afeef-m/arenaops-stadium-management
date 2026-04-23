"use client";

import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Event } from "@/services/coreService";
import EventStatusBadge from "./EventStatusBadge";

interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card
      className="bg-[#111827] border-white/5 text-white overflow-hidden group hover:border-[#10b981]/30 transition-all duration-500 flex flex-col h-full cursor-pointer"
      onClick={onClick}
    >
      {/* Image / Header */}
      <div className="relative h-48 overflow-hidden bg-black flex items-center justify-center">
        {event.imageUrl ? (
          <>
            <img
              src={event.imageUrl}
              alt={event.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#10b981]/20 to-blue-900/20 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <Calendar className="w-16 h-16 text-white/10 group-hover:scale-110 transition-transform duration-500" />
          </>
        )}

        {/* Status */}
        <div className="absolute top-4 left-4">
          <EventStatusBadge status={event.status} size="sm" />
        </div>
      </div>

      {/* Header */}
      <CardHeader className="pb-2">
        <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-[#10b981] transition-colors line-clamp-1">
          {event.name}
        </h3>

        <div className="flex items-center gap-4 mt-1">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <MapPin className="w-3 h-3 text-[#10b981]" />
            <span className="line-clamp-1">
              {event.stadiumName || "Venue TBD"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Calendar className="w-3 h-3 text-[#10b981]" />
            <span>{formatDate(event.createdAt)}</span>
          </div>
        </div>
      </CardHeader>

      {/* Description */}
      <CardContent className="flex-1">
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
          {event.description || "No description provided for this event."}
        </p>
      </CardContent>

      {/* Footer */}
      <CardFooter className="pt-4 border-t border-white/5 mt-auto bg-black/20">
        <Button
          variant="ghost"
          className="w-full text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-[#10b981] group-hover:bg-[#10b981]/5 flex items-center justify-center gap-2"
        >
          View Details
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
}



// "use client";

// import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
// import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Event } from "@/services/coreService";
// import EventStatusBadge from "./EventStatusBadge";

// interface EventCardProps {
//   event: Event;
//   onClick?: () => void;
// }

// export default function EventCard({ event, onClick }: EventCardProps) {
//   const formatDate = (dateString?: string) => {
//     if (!dateString) return "No date set";
//     return new Date(dateString).toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });
//   };

//   return (
//     <Card 
//       className="bg-[#111827] border-white/5 text-white overflow-hidden group hover:border-[#10b981]/30 transition-all duration-500 flex flex-col h-full cursor-pointer"
//       onClick={onClick}
//     >
//       {/* Event Header / Image Area */}
//       <div className="relative h-48 overflow-hidden bg-black flex items-center justify-center">
//         {event.imageUrl ? (
//           <>
//             <img
//               src={event.imageUrl}
//               alt={event.name}
//               className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//             />
//             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
//           </>
//         ) : (
//           <>
//             <div className="absolute inset-0 bg-gradient-to-br from-[#10b981]/20 to-blue-900/20 mix-blend-screen opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
//             <Calendar className="w-16 h-16 text-white/10 group-hover:scale-110 transition-transform duration-500" />
//           </>
//         )}

//         <div className="absolute top-4 left-4">
//           <EventStatusBadge status={event.status} size="sm" />
//         </div>
//       </div>

//       <CardHeader className="pb-2">
//         <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-[#10b981] transition-colors line-clamp-1">
//           {event.name}
//         </h3>
//         <div className="flex items-center gap-4 mt-1">
//           <div className="flex items-center gap-1.5 text-gray-500 text-xs">
//             <MapPin className="w-3 h-3 text-[#10b981]" />
//             <span className="line-clamp-1">{event.stadiumName || "Venue TBD"}</span>
//           </div>
//           <div className="flex items-center gap-1.5 text-gray-500 text-xs">
//             <Calendar className="w-3 h-3 text-[#10b981]" />
//             <span>{formatDate(event.createdAt)}</span>
//           </div>
//         </div>
//       </CardHeader>

//       <CardContent className="flex-1">
//         <p className="text-xs text-gray-400 leading-relaxed font-light line-clamp-2">
//           {event.description || "No description provided for this event."}
//         </p>
//       </CardContent>

//       <CardFooter className="pt-4 border-t border-white/5 mt-auto bg-black/20">
//         <Button 
//           variant="ghost" 
//           className="w-full text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-[#10b981] group-hover:bg-[#10b981]/5 p-0 flex items-center justify-center gap-2"
//         >
//           View Details
//           <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
//         </Button>
//       </CardFooter>
//     </Card>
//   )
// // const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
// //   Draft: { label: "Draft", bg: "bg-gray-500/20", text: "text-gray-300", dot: "bg-gray-400" },
// //   PendingApproval: { label: "Pending", bg: "bg-amber-500/20", text: "text-amber-300", dot: "bg-amber-400" },
// //   Approved: { label: "Approved", bg: "bg-blue-500/20", text: "text-blue-300", dot: "bg-blue-400" },
// //   Live: { label: "Live", bg: "bg-emerald-500/20", text: "text-emerald-300", dot: "bg-emerald-400" },
// //   Completed: { label: "Completed", bg: "bg-purple-500/20", text: "text-purple-300", dot: "bg-purple-400" },
// //   Cancelled: { label: "Cancelled", bg: "bg-red-500/20", text: "text-red-300", dot: "bg-red-400" },
// // };

// export default function EventCard({ event, onClick }: EventCardProps) {
//   const status = STATUS_CONFIG[event.status] || STATUS_CONFIG.Draft;

//   return (
//     <button
//       onClick={onClick}
//       className="group relative text-left w-full rounded-xl border border-white/5 bg-[#111827] overflow-hidden hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5"
//     >
//       {/* Image or gradient header */}
//       <div className="h-32 relative overflow-hidden">
//         {event.imageUrl ? (
//           <img
//             src={event.imageUrl}
//             alt={event.name}
//             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//           />
//         ) : (
//           <div className="w-full h-full bg-gradient-to-br from-emerald-600/30 via-blue-600/20 to-purple-600/30" />
//         )}
//         <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />

//         {/* Status badge */}
//         <div className="absolute top-3 right-3">
//           <span
//             className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.text} backdrop-blur-sm`}
//           >
//             <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${event.status === "Live" ? "animate-pulse" : ""}`} />
//             {status.label}
//           </span>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="p-4 space-y-3">
//         <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
//           {event.name}
//         </h3>

//         {event.description && (
//           <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
//             {event.description}
//           </p>
//         )}

//         <div className="flex flex-col gap-1.5">
//           {event.stadiumName && (
//             <div className="flex items-center gap-2 text-xs text-gray-400">
//               <MapPin size={12} className="text-gray-600 flex-shrink-0" />
//               <span className="truncate">{event.stadiumName}</span>
//             </div>
//           )}

//           {event.createdAt && (
//             <div className="flex items-center gap-2 text-xs text-gray-400">
//               <Calendar size={12} className="text-gray-600 flex-shrink-0" />
//               <span>{new Date(event.createdAt).toLocaleDateString()}</span>
//             </div>
//           )}
//         </div>

//         {/* Hover indicator */}
//         <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
//           <span>View Details</span>
//           <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
//             <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//           </svg>
//         </div>
//       </div>
//     </button>
//   );
// }
// }