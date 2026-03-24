"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Users, Globe, Search, Filter } from "lucide-react";
import { coreService, Stadium } from "@/services/coreService";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function StadiumDiscoveryPage() {
    const [stadiums, setStadiums] = useState<Stadium[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchStadiums = async () => {
            try {
                const res = await coreService.getStadiums();
                setStadiums(res.data);
            } catch (error) {
                console.error("Failed to fetch stadiums", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStadiums();
    }, []);

    const filteredStadiums = stadiums.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 min-h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white mb-2">
                        Discover <span className="text-[#10b981]">Stadiums</span>.
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Find the perfect venue for your next masterclass event
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input 
                        placeholder="Search by name or city..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#10b981]"
                    />
                </div>
                <Button variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-[#10b981] gap-2">
                    <Filter className="w-4 h-4" /> Filters
                </Button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-4 p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md">
                            <Skeleton className="h-48 w-full bg-white/5 rounded-lg" />
                            <Skeleton className="h-6 w-3/4 bg-white/5" />
                            <Skeleton className="h-4 w-1/2 bg-white/5" />
                            <Skeleton className="h-10 w-full mt-auto bg-white/5" />
                        </div>
                    ))
                ) : filteredStadiums.length > 0 ? (
                    filteredStadiums.map((stadium) => (
                        <Card key={stadium.stadiumId} className="bg-[#111827] border-white/5 text-white overflow-hidden group hover:border-[#10b981]/30 transition-all duration-500 flex flex-col">
                            <div className="relative h-48 overflow-hidden bg-black flex items-center justify-center">
                                {/* Procedural gradient backdrop since we don't have images in DB yet */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#10b981]/20 to-blue-900/20 mix-blend-screen opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                                
                                <Globe className="w-16 h-16 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                                
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 text-[#10b981]">
                                    <Users className="w-3 h-3" />
                                    {stadium.capacity?.toLocaleString() || "VARIES"} CAP
                                </div>
                            </div>
                            
                            <CardHeader>
                                <CardTitle className="text-xl font-bold tracking-tight text-white group-hover:text-[#10b981] transition-colors line-clamp-1">
                                    {stadium.name}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {stadium.city}, {stadium.state} • {stadium.country}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <p className="text-xs text-gray-400 leading-relaxed font-light line-clamp-2">
                                    Located in {stadium.city}, this premium venue features state-of-the-art facilities perfect for any large-scale event, from concerts to sporting matches.
                                </p>
                            </CardContent>

                            <CardFooter className="pt-4 border-t border-white/5 mt-auto bg-black/20">
                                <Link href={`/event-manager/stadiums/${stadium.stadiumId}`} className="w-full">
                                    <Button className="w-full bg-white text-black hover:bg-[#10b981] font-bold tracking-widest uppercase text-[10px] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                        View Venue Profile
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center justify-center opacity-50">
                        <Globe className="w-16 h-16 text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Stadiums Found</h3>
                        <p className="text-sm text-gray-400">Try adjusting your filters or search term.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
