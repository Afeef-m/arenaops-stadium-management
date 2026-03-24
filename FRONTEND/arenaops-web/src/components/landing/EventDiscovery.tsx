"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react"
import styles from "./EventDiscovery.module.scss"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { Event } from "@/services/coreService"

interface EventDiscoveryProps {
  events: Event[]
}
export function EventDiscovery({ events }: EventDiscoveryProps) {
    return (
        <section className={styles.eventDiscoverySection}>
            <div className="container mx-auto px-6 relative z-10">
                <div className={cn("flex flex-col md:flex-row justify-between items-end gap-4", styles.sectionHeader)}>
                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Upcoming E-Events</h2>
                        <p className="text-slate-400 max-w-2xl text-lg font-light leading-relaxed">
                            Discover the hottest matches, concerts, and exclusive experiences happening near you.
                        </p>
                    </div>
                    <Button variant="ghost" className="text-[#10b981] hover:text-[#10b981] hover:bg-white/5 group h-12 px-6 rounded-full border border-white/10">
                        View All Events <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                        <Card key={event.eventId} className={styles.eventCard}>
                            {/* Image Placeholder with Gradient */}
                            <div
                                className={styles.imagePlaceholder}
                                style={{ background: `linear-gradient(135deg, ${event.eventType ? '#1e3a8a' : '#581c87'} 0%, #3b82f6 100%)` }}
                            >
                                <span className={styles.categoryBadge}>{event.eventType || 'Event'}</span>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                    <h3 className="text-4xl font-black text-white italic tracking-tighter">
                                        {event.eventType?.toUpperCase() || 'EVENT'}
                                    </h3>
                                </div>
                            </div>

                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-bold text-white group-hover:text-[#10b981] transition-colors leading-tight">
                                    {event.name}
                                </CardTitle>
                                <CardDescription className={styles.iconLabel}>
                                    <MapPin className="w-4 h-4" /> {event.stadiumName || 'TBD'}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className={styles.iconLabel}>
                                    <Calendar className="w-4 h-4" />
                                    <span>{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'Date TBD'}</span>
                                </div>
                                <div className={styles.iconLabel}>
                                    <Users className="w-4 h-4" />
                                    <span>Event ID: {event.eventId.slice(0, 8)}</span>
                                </div>
                                <div className="pt-4 flex items-baseline gap-1">
                                    <span className={styles.priceTag}>₹999+</span>
                                    <span className="text-xs text-slate-500 font-medium tracking-wide">/ PERSON</span>
                                </div>
                            </CardContent>

                            <CardFooter className="pt-2">
                                <Link href={`/events/${event.eventId}`}>
                                <Button
                                    className={cn("w-full h-12 text-sm font-bold uppercase tracking-widest", styles.bookButton)}
                                    variant="outline"
                                    >
                                    Book Tickets
                                </Button>
                                    </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {events.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-400 text-lg">No events available at this time.</p>
                    </div>
                )}
            </div>

            {/* Subtle light leak for depth */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-linear-to-r from-transparent via-[#10b981]/30 to-transparent" />
        </section>
    )
}


