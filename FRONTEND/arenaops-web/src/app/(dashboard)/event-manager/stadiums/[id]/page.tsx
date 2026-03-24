"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { coreService, Stadium, SeatingPlan } from "@/services/coreService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Info, CalendarDays, Plus, ArrowLeft, LayoutTemplate, ShieldCheck } from "lucide-react";

export default function StadiumDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const [stadium, setStadium] = useState<Stadium | null>(null);
    const [seatingPlans, setSeatingPlans] = useState<SeatingPlan[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Mock available dates for BookMyShow style calendar
    const [selectedDate, setSelectedDate] = useState<number>(0);
    const dates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1); // Starting tomorrow
        return d;
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [stadiumRes, plansRes] = await Promise.all([
                    coreService.getStadium(id),
                    coreService.getSeatingPlans(id)
                ]);
                setStadium(stadiumRes.data);
                setSeatingPlans(plansRes.data || []);
            } catch (error) {
                console.error("Failed to fetch stadium details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse p-6">
                <Skeleton className="h-64 w-full bg-white/5 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="md:col-span-2 h-96 w-full bg-white/5 rounded-xl" />
                    <Skeleton className="h-96 w-full bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!stadium) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h1 className="text-3xl font-bold text-white mb-4">Venue Not Found</h1>
                <Button variant="outline" onClick={() => router.push("/event-manager/stadiums")}>Return to Discovery</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Nav */}
            <button 
                onClick={() => router.push("/event-manager/stadiums")}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Stadiums
            </button>

            {/* Stadium Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-black border border-white/10 shadow-2xl group">
                {/* Visual Image representation */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbf5ce0d46')] bg-cover bg-center opacity-40 mix-blend-screen grayscale group-hover:grayscale-0 transition-all duration-1000"></div>
                
                <div className="relative z-20 p-8 md:p-12 lg:p-16 flex flex-col justify-end min-h-[400px]">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/20 border border-[#10b981]/50 text-[#10b981] text-xs font-bold tracking-widest uppercase mb-6 w-fit backdrop-blur-md">
                        <ShieldCheck className="w-3 h-3" /> Certified Venue
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-white mb-4">
                        {stadium.name}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300 font-medium">
                        <span className="flex items-center gap-2"><MapPin className="text-[#10b981] w-4 h-4" /> {stadium.address}, {stadium.city}, {stadium.state}</span>
                        <span className="flex items-center gap-2"><Users className="text-[#10b981] w-4 h-4" /> {stadium.capacity?.toLocaleString() || "Capacity Varies"}</span>
                        {stadium.isApproved && <span className="text-[#10b981] border border-[#10b981] px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest bg-[#10b981]/10">System Approved</span>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Layouts & Specs */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-[#111827] border-white/5 text-white">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
                                <Info className="text-[#10b981] w-5 h-5"/> Venue Specifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400 leading-relaxed font-light mb-6">
                                The ultimate destination for massive events. Perfectly suited for concerts, international sporting events, and grand corporate masterclasses. This arena supports dynamic seating layouts and features high-fidelity acoustics.
                            </p>
                            
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold tracking-widest uppercase text-gray-500 mb-2 border-b border-white/10 pb-2">Supported Seating Blueprints</h4>
                                
                                {seatingPlans.length > 0 ? (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {seatingPlans.map(plan => (
                                            <div key={plan.seatingPlanId} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-white/10 text-gray-500 group-hover:text-[#10b981] group-hover:border-[#10b981]/50 transition-colors">
                                                    <LayoutTemplate className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{plan.name}</p>
                                                    <p className="text-xs text-gray-500">{plan.description || "Standard configuration"}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 border border-dashed border-white/10 rounded-xl bg-black/20 text-center">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-600">No Presets Available. Custom Layout Required.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Availability & Booking CTA (BookMyShow Style) */}
                <div className="space-y-6">
                    <Card className="bg-[#111827] border-white/5 text-white sticky top-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/10 rounded-full blur-[50px] pointer-events-none"></div>

                        <CardHeader className="border-b border-white/5 pb-6">
                            <CardTitle className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
                                <CalendarDays className="text-[#10b981] w-5 h-5"/> Availability
                            </CardTitle>
                        </CardHeader>
                        
                        <CardContent className="pt-6 relative z-10">
                            {/* Date Strip */}
                            <div className="flex gap-2 justify-between mb-8 overflow-x-auto pb-4 custom-scrollbar">
                                {dates.map((date, idx) => {
                                    const isSelected = idx === selectedDate;
                                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                    const dayNum = date.getDate();
                                    const month = date.toLocaleDateString('en-US', { month: 'short' });
                                    
                                    // Mock random availability
                                    const isAvailable = idx !== 2 && idx !== 5;

                                    return (
                                        <button 
                                            key={idx}
                                            onClick={() => isAvailable && setSelectedDate(idx)}
                                            disabled={!isAvailable}
                                            className={`flex flex-col items-center justify-center min-w-[50px] h-16 rounded-lg border transition-all duration-300 ${
                                                isSelected 
                                                    ? 'bg-[#10b981] border-[#10b981] text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] transform scale-105' 
                                                    : isAvailable 
                                                        ? 'bg-transparent border-white/10 text-white hover:border-[#10b981]/50 hover:bg-[#10b981]/10' 
                                                        : 'bg-black/50 border-white/5 text-gray-700 cursor-not-allowed opacity-50'
                                            }`}
                                        >
                                            <span className="text-[10px] uppercase font-bold tracking-widest">{month}</span>
                                            <span className={`text-xl font-black ${isSelected ? 'text-black' : 'text-white'}`}>{dayNum}</span>
                                            <span className={`text-[8px] uppercase tracking-widest ${isSelected ? 'text-black/70' : 'text-gray-500'}`}>{dayName}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Slot Times */}
                            <div className="space-y-3 mb-8">
                                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2 border-b border-white/10 pb-2">Available Slots</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-4 py-2 rounded border border-[#10b981]/30 text-[#10b981] text-xs font-bold bg-[#10b981]/10 cursor-pointer hover:bg-[#10b981] hover:text-black transition-colors">09:00 AM</span>
                                    <span className="px-4 py-2 rounded border border-[#10b981]/30 text-[#10b981] text-xs font-bold bg-[#10b981]/10 cursor-pointer hover:bg-[#10b981] hover:text-black transition-colors">02:00 PM</span>
                                    <span className="px-4 py-2 rounded border border-[#10b981]/30 text-[#10b981] text-xs font-bold bg-[#10b981]/10 cursor-pointer hover:bg-[#10b981] hover:text-black transition-colors">07:30 PM</span>
                                </div>
                            </div>

                            <Button 
                                onClick={() => router.push(`/event-manager/events/create?stadiumId=${id}`)}
                                className="w-full h-14 bg-white text-black hover:bg-[#10b981] font-black tracking-widest uppercase text-xs transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] group"
                            >
                                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" /> Propose Event
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
