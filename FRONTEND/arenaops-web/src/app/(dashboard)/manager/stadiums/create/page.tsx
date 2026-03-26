"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { coreService, type CreateStadiumPayload } from "@/services/coreService";
import { uploadService } from "@/services/uploadService";
import Link from "next/link";
import styles from "./create.module.scss";
import { cn } from "@/lib/utils";

type NotificationType = { type: "success" | "error"; message: string } | null;

export default function CreateStadiumPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<NotificationType>(null);

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
    });

    const showNotification = (type: "success" | "error", message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            showNotification("error", "Stadium name is required");
            return;
        }
        if (!formData.city.trim()) {
            showNotification("error", "City is required");
            return;
        }
        if (!formData.country.trim()) {
            showNotification("error", "Country is required");
            return;
        }

        setSaving(true);
        try {
            let finalFormData = { ...formData };

            // Upload image first if selected
            if (selectedFile) {
                const uploadRes = await uploadService.uploadImage(selectedFile, {
                    folder: "arenaops/stadiums/temp",
                });

                if (uploadRes.success && uploadRes.data) {
                    finalFormData = {
                        ...finalFormData,
                        imageUrl: uploadRes.data.url,
                        imagePublicId: uploadRes.data.publicId,
                    };
                } else {
                    showNotification("error", "Image upload failed. Proceeding without image.");
                }
            }

            // Create stadium with full data including image info
            const response = await coreService.createStadium(finalFormData);

            if (response.success && response.data) {
                showNotification("success", "Stadium created successfully");
                setTimeout(() => {
                    router.push("/manager");
                }, 1000);
            } else {
                showNotification("error", response.message || "Failed to create stadium");
            }
        } catch {
            showNotification("error", "Failed to create stadium");
        } finally {
            setSaving(false);
        }
    };

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

            <div className={styles.container}>
                {/* Header */}
                <header className={styles.header}>
                    <Link href="/manager" className={styles.backButton}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className={styles.title}>Create Stadium</h1>
                        <p className={styles.subtitle}>Add a new stadium to your portfolio</p>
                    </div>
                </header>

                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
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
                                <span>Click to upload image</span>
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
                                    placeholder="Enter stadium name"
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
                                    placeholder="Enter full address"
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
                                    placeholder="City"
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
                                    placeholder="State/Province"
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
                                    placeholder="Country"
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
                                    placeholder="Enter pincode"
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
                                    placeholder="e.g., 40.7128"
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
                                    placeholder="e.g., -74.0060"
                                    className={styles.input}
                                    step="any"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <Link href="/manager" className={styles.cancelButton}>
                            Cancel
                        </Link>
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
                            Create Stadium
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
