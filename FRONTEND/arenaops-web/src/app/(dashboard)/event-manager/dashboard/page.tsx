"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, Users, Activity, CalendarClock } from "lucide-react";
import Link from "next/link";

export default function EventManagerDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);

  // Simulate initial fake loading for premium feel
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      label: "Active Events",
      value: "0",
      description: "Events currently running or published",
      icon: Activity,
    },
    {
      label: "Total Tickets Sold",
      value: "0",
      description: "Across all active events",
      icon: Ticket,
    },
    {
      label: "Upcoming Schedules",
      value: "0",
      description: "Slots configured for next 7 days",
      icon: CalendarClock,
    },
    {
      label: "Target Revenue",
      value: "$0.00",
      description: "Estimated gross based on inventory",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white mb-2">
            Welcome, <span className="text-[#10b981]">{user?.fullName || "Commander"}</span>.
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            System Operations Overview
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/event-manager/events/create" className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#10b981] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
            + New Event
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="bg-[#111827] border-white/5 text-white backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#10b981]">
                  {stat.label}
                </CardTitle>
                <Icon size={16} className="text-gray-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                    <Skeleton className="h-10 w-24 bg-white/5 rounded-md" />
                ) : (
                    <div className="text-4xl font-black tracking-tighter italic mb-1">{stat.value}</div>
                )}
                {loading ? (
                    <Skeleton className="h-3 w-32 mt-3 bg-white/5 rounded-md" />
                ) : (
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    {stat.description}
                    </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Grid areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#111827] border-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
               Live Telemetry
            </CardTitle>
            <CardDescription className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">
                Real-time ticket movement
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border border-dashed border-white/10 rounded-xl m-4 bg-black/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
                <p className="text-xs uppercase tracking-[0.3em] font-bold text-gray-600 z-10 flex flex-col items-center gap-4">
                     [ INITIALIZING TELEMETRY STREAM ]
                     <span className="w-8 h-px bg-[#10b981]/50"></span>
                </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest italic">
               Recent Dispatches
            </CardTitle>
          </CardHeader>
          <CardContent>
               <div className="flex flex-col gap-4">
                  {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-lg" />
                      ))
                  ) : (
                      <div className="text-center py-10">
                          <p className="text-xs uppercase tracking-widest font-bold text-gray-500">NO ACTION LOGGED</p>
                      </div>
                  )}
               </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
