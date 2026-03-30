"use client";

import Link from "next/link";
import { MapPin, Users, Calendar, CheckCircle, Clock, Building2 } from "lucide-react";
import type { Stadium } from "@/services/coreService";
import styles from "./StadiumCard.module.scss";
import { cn } from "@/lib/utils";

interface StadiumCardProps {
    stadium: Stadium;
    eventCount?: number;
}

export function StadiumCard({ stadium, eventCount = 0 }: StadiumCardProps) {
    return (
        <Link href={`/manager/stadiums/${stadium.stadiumId}`} className={styles.cardLink}>
            <article className={styles.card}>
                {/* Image Section */}
                <div className={styles.imageWrapper}>
                    {stadium.imageUrl ? (
                        <img
                            src={stadium.imageUrl}
                            alt={stadium.name}
                            className={styles.stadiumImage}
                        />
                    ) : (
                        <div className={styles.placeholderImage}>
                            <Building2 size={40} />
                        </div>
                    )}
                    <div className={styles.imageOverlay} />
                    
                    {/* Status Badge */}
                    <div className={styles.statusContainer}>
                        <span
                            className={cn(
                                styles.statusBadge,
                                stadium.isApproved ? styles.approved : styles.pending
                            )}
                        >
                            {stadium.isApproved ? (
                                <>
                                    <CheckCircle size={12} />
                                    Approved
                                </>
                            ) : (
                                <>
                                    <Clock size={12} />
                                    Pending
                                </>
                            )}
                        </span>
                    </div>
                </div>

                <div className={styles.cardBody}>
                    {/* Content */}
                    <div className={styles.content}>
                        <h3 className={styles.name}>{stadium.name}</h3>

                        <div className={styles.location}>
                            <MapPin size={14} />
                            <span>
                                {stadium.city}, {stadium.country} {stadium.pincode && `(${stadium.pincode})`}
                            </span>
                        </div>

                        <p className={styles.address}>{stadium.address}</p>
                    </div>

                    {/* Stats */}
                    <div className={styles.stats}>
                        {stadium.capacity && (
                            <div className={styles.stat}>
                                <Users size={14} />
                                <span>{stadium.capacity.toLocaleString()}</span>
                            </div>
                        )}
                        <div className={styles.stat}>
                            <Calendar size={14} />
                            <span>{eventCount} Events</span>
                        </div>
                    </div>

                    {/* Hover Indicator */}
                    <div className={styles.hoverIndicator}>
                        <span>View Details</span>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M3 8H13M13 8L8 3M13 8L8 13"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
            </article>
        </Link>
    );
}

export default StadiumCard;
