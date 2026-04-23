"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    Building2,
    MapPin,
    Globe,
    Save,
    Loader2,
    Upload,
    X,
    CheckCircle,
    AlertCircle,
    Trash2,
    Calendar,
    Users,
    Grid3X3,
    Power,
} from "lucide-react";
import {
    coreService,
    type Stadium,
    type CreateStadiumPayload,
    type Event,
} from "@/services/coreService";
import { uploadService } from "@/services/uploadService";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import styles from "./detail.module.scss";
import { cn } from "@/lib/utils";

type NotificationType = { type: "success" | "error"; message: string } | null;

export default function StadiumDetailPage() {
    const router = useRouter();
    const params = useParams();
    const stadiumId = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [notification, setNotification] = useState<NotificationType>(null);

    const [stadium, setStadium] = useState<Stadium | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [eventStartDates, setEventStartDates] = useState<Record<string, string>>({});

    // Image state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreateStadiumPayload>({
        name: "",
        address: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
        latitude: 0,
        longitude: 0,
        isActive: true,
    });

    useEffect(() => {
        if (stadiumId) {
            fetchStadiumData();
        }
    }, [stadiumId]);

    const fetchStadiumData = async () => {
        try {
            const [stadiumRes, eventsRes] = await Promise.all([
                coreService.getStadium(stadiumId),
                coreService.getEventsByStadium(stadiumId).catch(() => ({ success: false, data: [] })),
            ]);

            if (stadiumRes.success && stadiumRes.data) {
                const s = stadiumRes.data;
                setStadium(s);
                setFormData({
                    name: s.name || "",
                    address: s.address || "",
                    city: s.city || "",
                    state: s.state || "",
                    country: s.country || "",
                    pincode: s.pincode || "",
                    latitude: s.latitude || 0,
                    longitude: s.longitude || 0,
                    isActive: s.isActive ?? true,
                });
            }

            if (eventsRes.success && eventsRes.data) {
                setEvents(eventsRes.data);

                const eventStartDateEntries = await Promise.all(
                    eventsRes.data.map(async (event) => {
                        try {
                            const slotsRes = await coreService.getEventSlots(event.eventId);
                            const firstSlotStart = slotsRes.data?.[0]?.startTime;

                            return [event.eventId, firstSlotStart ?? ""] as const;
                        } catch {
                            return [event.eventId, ""] as const;
                        }
                    })
                );

                setEventStartDates(Object.fromEntries(eventStartDateEntries));
            }
        } catch {
            showNotification("error", "Failed to load stadium");
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (type: "success" | "error", message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const formatEventDate = (eventId: string) => {
        const startTime = eventStartDates[eventId];

        if (!startTime) {
            return "Schedule TBD";
        }

        return new Date(startTime).toLocaleDateString();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? parseFloat(value) || 0 : value,
        }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showNotification("error", "Image must be less than 5MB");
                return;
            }
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const clearImage = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showNotification("error", "Stadium name is required");
            return;
        }

        setSaving(true);
        try {
            let finalFormData = { ...formData };

            // Upload new image if selected
            if (selectedFile) {
                const uploadRes = await uploadService.uploadStadiumImage(selectedFile, stadiumId);
                
                if (uploadRes.success && uploadRes.data) {
                    finalFormData = {
                        ...finalFormData,
                        imageUrl: uploadRes.data.url,
                        imagePublicId: uploadRes.data.publicId,
                    };
                } else {
                    showNotification("error", "Image upload failed. Proceeding with existing image.");
                }
            }

            const response = await coreService.updateStadium(stadiumId, finalFormData);

            if (response.success) {
                showNotification("success", "Stadium updated successfully");
                setStadium(response.data);
                clearImage();
            } else {
                showNotification("error", response.message || "Failed to update stadium");
            }
        } catch {
            showNotification("error", "Failed to update stadium");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const response = await coreService.deleteStadium(stadiumId);

            if (response.success) {
                showNotification("success", "Stadium deleted successfully");
                setTimeout(() => {
                    router.push("/manager");
                }, 1000);
            } else {
                showNotification("error", response.message || "Failed to delete stadium");
            }
        } catch {
            showNotification("error", "Failed to delete stadium");
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spinner} size={32} />
            </div>
        );
    }

    if (!stadium) {
        return (
            <div className={styles.errorContainer}>
                <AlertCircle size={48} />
                <p>Stadium not found</p>
                <Link href="/manager">
                    <Button>Back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Toast Notification */}
            {notification && (
                <div
                    className={cn(
                        styles.toast,
                        notification.type === "success" ? styles.toastSuccess : styles.toastError
                    )}
                    role="alert"
                >
                    {notification.type === "success" ? (
                        <CheckCircle size={18} />
                    ) : (
                        <AlertCircle size={18} />
                    )}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className={styles.deleteDialog}>
                    <DialogHeader>
                        <DialogTitle>Delete Stadium</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{stadium.name}&quot;? This action cannot
                            be undone and will remove all associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={deleting}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <Loader2 size={16} className={styles.spinner} />
                            ) : (
                                <Trash2 size={16} />
                            )}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className={styles.container}>
                {/* Header */}
                <header className={styles.header}>
                    <Link href="/manager" className={styles.backButton}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div className={styles.headerContent}>
                        <div>
                            <h1 className={styles.title}>{stadium.name}</h1>
                            <p className={styles.subtitle}>
                                <MapPin size={14} />
                                {stadium.city}, {stadium.country}
                            </p>
                        </div>
                        <div className={styles.headerBadges}>
                            <span
                                className={cn(
                                    styles.statusBadge,
                                    stadium.isApproved ? styles.approved : styles.pending
                                )}
                            >
                                {stadium.isApproved ? "Approved" : "Pending Approval"}
                            </span>
                            <span
                                className={cn(
                                    styles.statusBadge,
                                    (stadium.isActive ?? true) ? styles.approved : styles.pending
                                )}
                            >
                                {(stadium.isActive ?? true) ? "Active" : "Hidden"}
                            </span>
                            {stadium.capacity && (
                                <span className={styles.capacityBadge}>
                                    <Users size={14} />
                                    {stadium.capacity.toLocaleString()} capacity
                                </span>
                            )}
                        </div>
                        <div className={styles.headerActions}>
                            <Link href={`/manager/stadiums/${stadiumId}/layout/builder`}>
                                <Button variant="outline" className={styles.layoutButton}>
                                    <Grid3X3 size={16} className="mr-2" />
                                    Stadium Layout
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                <div className={styles.content}>
                    {/* Edit Form */}
                    <form onSubmit={handleUpdate} className={styles.form}>
                        {/* Image Upload */}
                        <div className={styles.imageSection}>
                            <label className={styles.label}>Stadium Image</label>
                            {previewUrl ? (
                                <div className={styles.imagePreview}>
                                    <img src={previewUrl} alt="Preview" />
                                    <button
                                        type="button"
                                        className={styles.removeImage}
                                        onClick={clearImage}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className={styles.uploadZone}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={32} />
                                    <span>Click to upload new image</span>
                                    <span className={styles.uploadHint}>Max 5MB, JPG/PNG</span>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileSelect}
                                className={styles.hiddenInput}
                            />
                        </div>

                        {/* Basic Info */}
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <Building2 size={18} />
                                Basic Information
                            </h2>

                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Stadium Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Address *</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <MapPin size={18} />
                                Location
                            </h2>

                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>City *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>State *</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Country *</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Pincode *</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Coordinates */}
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <Globe size={18} />
                                Coordinates
                            </h2>

                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Latitude</label>
                                    <input
                                        type="number"
                                        name="latitude"
                                        value={formData.latitude}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        step="any"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Longitude</label>
                                    <input
                                        type="number"
                                        name="longitude"
                                        value={formData.longitude}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        step="any"
                                    />
                                </div>
                            </div>
                        </div>
 
                        {/* Status Toggle */}
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <Power size={18} />
                                Availability Status
                            </h2>
                            <div className={styles.statusToggleContainer}>
                                <div className={styles.statusInfo}>
                                    <p className={styles.statusLabel}>
                                        Currently: <span className={cn(styles.statusValue, formData.isActive ? styles.active : styles.inactive)}>
                                            {formData.isActive ? "Active" : "Non-Active"}
                                        </span>
                                    </p>
                                    <p className={styles.statusDescription}>
                                        {formData.isActive 
                                            ? "This stadium is visible to event managers and can host new events."
                                            : "This stadium is hidden from venue discovery and cannot host new events."}
                                    </p>
                                </div>
                                <Button 
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                    className={cn(
                                        styles.toggleButton,
                                        formData.isActive ? styles.toggleActive : styles.toggleInactive
                                    )}
                                >
                                    <Power size={16} className="mr-2" />
                                    {formData.isActive ? "Deactivate Stadium" : "Activate Stadium"}
                                </Button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={styles.actions}>
                            <button
                                type="button"
                                onClick={() => setShowDeleteDialog(true)}
                                className={styles.deleteButton}
                            >
                                <Trash2 size={18} />
                                Delete Stadium
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className={styles.submitButton}
                            >
                                {saving ? (
                                    <Loader2 size={18} className={styles.spinner} />
                                ) : (
                                    <Save size={18} />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </form>

                    {/* Events Section */}
                    <div className={styles.eventsSection}>
                        <h2 className={styles.sectionTitle}>
                            <Calendar size={18} />
                            Events at this Stadium
                        </h2>

                        {events.length === 0 ? (
                            <div className={styles.emptyEvents}>
                                <Calendar size={32} />
                                <p>No events scheduled at this stadium</p>
                            </div>
                        ) : (
                            <div className={styles.eventsList}>
                                {events.map((event) => (
                                    <div key={event.eventId} className={styles.eventCard}>
                                        <div className={styles.eventInfo}>
                                            <h3 className={styles.eventName}>{event.name}</h3>
                                            <p className={styles.eventDate}>
                                                {formatEventDate(event.eventId)}
                                            </p>
                                        </div>
                                        <span
                                            className={cn(
                                                styles.eventStatus,
                                                event.status === "Live" && styles.live,
                                                event.status === "Completed" && styles.completed,
                                                event.status === "Cancelled" && styles.cancelled
                                            )}
                                        >
                                            {event.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
