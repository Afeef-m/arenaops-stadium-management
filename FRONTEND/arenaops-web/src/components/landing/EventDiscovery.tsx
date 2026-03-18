"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react"
import styles from "./EventDiscovery.module.scss"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Event } from "@/types/event"

// Mock Data for Placeholder
const mockEvents = [
    {
        id: 1,
        title: "Championship Final: Red vs Blue",
        date: "Oct 15, 2026 • 8:00 PM",
        location: "Grand Arena Stadium",
        capacity: "45,000 Seats",
        ticketPrice: "$45 - $250",
        category: "Football",
        color: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)"
    },
    {
        id: 2,
        title: "Global Music Festival 2026",
        date: "Nov 02, 2026 • 6:00 PM",
        location: "City Central Park",
        capacity: "60,000 Seats",
        ticketPrice: "$80 - $400",
        category: "Concert",
        color: "linear-gradient(135deg, #581c87 0%, #a855f7 100%)"
    },
    {
        id: 3,
        title: "National Basketball League",
        date: "Dec 10, 2026 • 7:30 PM",
        location: "Indoor Sports Complex",
        capacity: "18,000 Seats",
        ticketPrice: "$25 - $120",
        category: "Basketball",
        color: "linear-gradient(135deg, #7c2d12 0%, #f97316 100%)"
    }
]
interface EventDiscoveryProps {
  events: Event[]
}
export function EventDiscovery({ events: _events }: EventDiscoveryProps) {
    void _events;

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
                    <Button variant="ghost" className="text-primary hover:text-primary hover:bg-white/5 group h-12 px-6 rounded-full border border-white/10">
                        View All Events <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {mockEvents.map((event) => (
                        <Card key={event.id} className={styles.eventCard}>
                            {/* Image Placeholder with Gradient */}
                            <div
                                className={styles.imagePlaceholder}
                                style={{ background: event.color }}
                            >
                                <span className={styles.categoryBadge}>{event.category}</span>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                    <h3 className="text-4xl font-black text-white italic tracking-tighter">
                                        {event.category.toUpperCase()}
                                    </h3>
                                </div>
                            </div>

                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors leading-tight">
                                    {event.title}
                                </CardTitle>
                                <CardDescription className={styles.iconLabel}>
                                    <MapPin className="w-4 h-4" /> {event.location}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className={styles.iconLabel}>
                                    <Calendar className="w-4 h-4" />
                                    <span>{event.date}</span>
                                </div>
                                <div className={styles.iconLabel}>
                                    <Users className="w-4 h-4" />
                                    <span>{event.capacity}</span>
                                </div>
                                <div className="pt-4 flex items-baseline gap-1">
                                    <span className={styles.priceTag}>{event.ticketPrice}</span>
                                    <span className="text-xs text-slate-500 font-medium tracking-wide">/ PERSON</span>
                                </div>
                            </CardContent>

                            <CardFooter className="pt-2">
                                <Link href={`/events/${event.id}`}>
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
            </div>

            {/* Subtle light leak for depth */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
        </section>
    )
}

