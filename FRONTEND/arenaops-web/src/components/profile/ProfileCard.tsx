"use client";

import {
  User,
  Mail,
  Phone,
  CheckCircle,
  Calendar,
  Building2,
  Briefcase,
  Globe,
} from "lucide-react";
import styles from "./ProfileCard.module.scss";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EventManagerDetails {
  organizationName?: string;
  gstNumber?: string;
  designation?: string;
  website?: string;
}

export interface UserProfile {
  userId: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  roles?: string[];
  isEmailVerified?: boolean;
  createdAt?: string;
}

export interface ProfileCardProps {
  user: UserProfile;
  eventManagerDetails?: EventManagerDetails;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(isoDate?: string): string {
  if (!isoDate) return "Not available";
  try {
    return new Date(isoDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
}

function isUserRole(roles?: string[]): boolean {
  if (!roles) return false;
  return roles.some((role) => role.toLowerCase() === "user");
}

function hasEventManagerInfo(details?: EventManagerDetails): boolean {
  if (!details) return false;
  return !!(details.organizationName || details.designation);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProfileCard({ user, eventManagerDetails }: ProfileCardProps) {
  const showEventManagerSection =
    !isUserRole(user.roles) && hasEventManagerInfo(eventManagerDetails);

  return (
    <article className={styles.profileCard} aria-label="User profile card">
      {/* Header with Avatar */}
      <header className={styles.header}>
        <div className={styles.avatarWrapper}>
          {user.profilePictureUrl ? (
            <Image
              src={user.profilePictureUrl}
              alt={`${user.fullName || "User"}'s profile picture`}
              fill
              className={`${styles.avatar} object-cover`}
            />
          ) : (
            <div className={styles.avatarPlaceholder} aria-hidden="true">
              <User className={styles.avatarIcon} />
            </div>
          )}
        </div>

        <div className={styles.headerInfo}>
          <h2 className={styles.name}>{user.fullName || "Anonymous User"}</h2>

          <div className={styles.badges}>
            {user.roles?.map((role) => (
              <span
                key={role}
                className={styles.roleBadge}
                aria-label={`Role: ${role}`}
              >
                {role}
              </span>
            ))}

            {user.isEmailVerified && (
              <span
                className={cn(styles.badge, styles.verifiedBadge)}
                aria-label="Email verified"
              >
                <CheckCircle size={12} />
                Verified
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Contact Information */}
      <section className={styles.section} aria-labelledby="contact-heading">
        <h3 id="contact-heading" className={styles.sectionTitle}>
          Contact Information
        </h3>

        <dl className={styles.infoList}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>
              <Mail size={16} aria-hidden="true" />
              Email
            </dt>
            <dd className={styles.infoValue}>{user.email || "Not provided"}</dd>
          </div>

          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>
              <Phone size={16} aria-hidden="true" />
              Phone
            </dt>
            <dd className={styles.infoValue}>
              {user.phoneNumber || "Not provided"}
            </dd>
          </div>

          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>
              <Calendar size={16} aria-hidden="true" />
              Member Since
            </dt>
            <dd className={styles.infoValue}>{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
      </section>

      {/* Event Manager Section (conditional) */}
      {showEventManagerSection && eventManagerDetails && (
        <section
          className={styles.section}
          aria-labelledby="organization-heading"
        >
          <h3 id="organization-heading" className={styles.sectionTitle}>
            Organization Details
          </h3>

          <dl className={styles.infoList}>
            {eventManagerDetails.organizationName && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>
                  <Building2 size={16} aria-hidden="true" />
                  Organization
                </dt>
                <dd className={styles.infoValue}>
                  {eventManagerDetails.organizationName}
                </dd>
              </div>
            )}

            {eventManagerDetails.designation && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>
                  <Briefcase size={16} aria-hidden="true" />
                  Designation
                </dt>
                <dd className={styles.infoValue}>
                  {eventManagerDetails.designation}
                </dd>
              </div>
            )}

            {eventManagerDetails.gstNumber && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>GST Number</dt>
                <dd className={cn(styles.infoValue, styles.mono)}>
                  {eventManagerDetails.gstNumber}
                </dd>
              </div>
            )}

            {eventManagerDetails.website && (
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>
                  <Globe size={16} aria-hidden="true" />
                  Website
                </dt>
                <dd className={styles.infoValue}>
                  <a
                    href={eventManagerDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {eventManagerDetails.website}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </article>
  );
}

export default ProfileCard;
