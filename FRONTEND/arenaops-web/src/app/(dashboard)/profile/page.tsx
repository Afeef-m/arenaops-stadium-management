"use client";

import { useState, useEffect, useRef } from "react";
import {
    User,
    Shield,
    Phone,
    Camera,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle,
    Building2,
    Calendar,
    Ticket,
    Globe,
    FileText,
    ExternalLink,
    X,
    Upload,
} from "lucide-react";
import {
    authService,
    type UserProfile,
    type UpdateProfilePayload,
    type ChangePasswordPayload,
} from "@/services/authService";
import { coreService, type Booking } from "@/services/coreService";
import { uploadService } from "@/services/uploadService";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import styles from "./profile.module.scss";
import { cn } from "@/lib/utils";

type TabType = "general" | "security" | "bookings";
type NotificationType = { type: "success" | "error"; message: string } | null;

export default function ProfilePage() {
    const dispatch = useDispatch<AppDispatch>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<UserProfile | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("general");
    const [notification, setNotification] = useState<NotificationType>(null);

    // Image upload state
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        organizationName: "",
        gstNumber: "",
        designation: "",
        website: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await authService.getProfile();
            if (response.success && response.data) {
                const u = response.data;
                setUser(u);

                setFormData({
                    fullName: u.fullName || "",
                    phoneNumber: u.phoneNumber || "",
                    organizationName: u.eventManagerDetails?.organizationName || "",
                    gstNumber: u.eventManagerDetails?.gstNumber || "",
                    designation: u.eventManagerDetails?.designation || "",
                    website: u.eventManagerDetails?.website || "",
                });

                // Fetch bookings if user role
                if (isUser(u.roles)) {
                    try {
                        const bookingsResponse = await coreService.getMyBookings();
                        if (bookingsResponse.success) {
                            setBookings(bookingsResponse.data || []);
                        }
                    } catch {
                        // Bookings API might not be implemented yet
                    }
                }
            }
        } catch (err) {
            showNotification("error", "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (type: "success" | "error", message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const isManager = (roles?: string[]) =>
        roles?.some((r) => r.toLowerCase() === "event_manager" || r.toLowerCase() === "eventmanager");
    const isUser = (roles?: string[]) =>
        roles?.some((r) => r.toLowerCase() === "user");

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: UpdateProfilePayload = {
                fullName: formData.fullName || undefined,
                phoneNumber: formData.phoneNumber || undefined,
            };

            // Include manager fields if applicable
            if (isManager(user?.roles)) {
                payload.organizationName = formData.organizationName || undefined;
                payload.gstNumber = formData.gstNumber || undefined;
                payload.designation = formData.designation || undefined;
                payload.website = formData.website || undefined;
            }

            const response = await authService.updateProfile(payload);
            if (response.success) {
                setUser(response.data);
                showNotification("success", "Profile updated successfully");

                // Update localStorage user data
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    userData.fullName = response.data.fullName;
                    localStorage.setItem("user", JSON.stringify(userData));
                }
            } else {
                showNotification("error", response.message || "Update failed");
            }
        } catch {
            showNotification("error", "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showNotification("error", "Passwords do not match");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            showNotification("error", "Password must be at least 8 characters");
            return;
        }

        setSaving(true);
        try {
            const payload: ChangePasswordPayload = {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            };

            const response = await authService.changePassword(payload);
            if (response.success) {
                showNotification("success", "Password changed successfully");
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                showNotification("error", response.message || "Password change failed");
            }
        } catch {
            showNotification("error", "Failed to change password");
        } finally {
            setSaving(false);
        }
    };

    // Image upload handlers
    const handleCameraClick = () => {
        setShowImageModal(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showNotification("error", "Image must be less than 5MB");
                return;
            }

            // Store file for upload
            setSelectedFile(file);
            // Create preview URL for display
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleImageUpload = async () => {
        if (!selectedFile || !user?.userId) return;

        setUploadingImage(true);
        try {
            // Step 1: Upload to Cloudinary
            const uploadResult = await uploadService.uploadProfilePicture(
                selectedFile,
                user.userId
            );

            if (!uploadResult.success || !uploadResult.data) {
                showNotification("error", uploadResult.error || "Upload failed");
                return;
            }

            // Step 2: Update profile with Cloudinary URL
            const payload: UpdateProfilePayload = {
                profilePictureUrl: uploadResult.data.url,
            };

            const response = await authService.updateProfile(payload);
            if (response.success) {
                setUser(response.data);
                showNotification("success", "Profile picture updated");
                closeModal();

                // Update localStorage
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    userData.profilePictureUrl = response.data.profilePictureUrl;
                    localStorage.setItem("user", JSON.stringify(userData));
                }
            } else {
                showNotification("error", "Failed to update profile");
            }
        } catch {
            showNotification("error", "Failed to upload image");
        } finally {
            setUploadingImage(false);
        }
    };

    const closeModal = () => {
        setShowImageModal(false);
        // Clean up preview URL to avoid memory leaks
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spinner} size={32} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.errorContainer}>
                <AlertCircle size={48} />
                <p>Failed to load profile</p>
            </div>
        );
    }

    return (
        <div className={styles.profilePage}>
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

            {/* Image Upload Modal */}
            {showImageModal && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Update Profile Picture</h3>
                            <button className={styles.modalClose} onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {previewUrl ? (
                                <div className={styles.imagePreview}>
                                    <img src={previewUrl} alt="Preview" />
                                </div>
                            ) : (
                                <div
                                    className={styles.uploadZone}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={32} />
                                    <span>Click to select an image</span>
                                    <span style={{ fontSize: "0.75rem" }}>Max 5MB, JPG/PNG</span>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileSelect}
                                className={styles.hiddenInput}
                            />

                            <div className={styles.modalActions}>
                                {previewUrl && (
                                    <button
                                        className={cn(styles.modalButton, styles.modalButtonSecondary)}
                                        onClick={() => {
                                            if (previewUrl) URL.revokeObjectURL(previewUrl);
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                    >
                                        Change
                                    </button>
                                )}
                                <button
                                    className={cn(styles.modalButton, styles.modalButtonPrimary)}
                                    onClick={selectedFile ? handleImageUpload : () => fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                >
                                    {uploadingImage ? (
                                        <Loader2 size={16} className={styles.spinner} />
                                    ) : selectedFile ? (
                                        "Save"
                                    ) : (
                                        "Select Image"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.container}>
                {/* Header Section */}
                <header className={styles.header}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper}>
                            {user.profilePictureUrl ? (
                                <img
                                    src={user.profilePictureUrl}
                                    alt="Avatar"
                                    className={styles.avatar}
                                />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    <User size={40} />
                                </div>
                            )}
                        </div>
                        <button
                            className={styles.cameraButton}
                            aria-label="Change profile picture"
                            onClick={handleCameraClick}
                        >
                            <Camera size={14} />
                        </button>
                    </div>

                    <div className={styles.headerInfo}>
                        <h1 className={styles.name}>{user.fullName || "User"}</h1>
                        <div className={styles.badges}>
                            <span className={styles.roleBadge}>{user.roles?.join(", ")}</span>
                            {user.isEmailVerified && (
                                <span className={styles.verifiedBadge}>Verified</span>
                            )}
                        </div>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <nav className={styles.tabNav} role="tablist">
                    <button
                        role="tab"
                        aria-selected={activeTab === "general"}
                        onClick={() => setActiveTab("general")}
                        className={cn(styles.tab, activeTab === "general" && styles.tabActive)}
                    >
                        <User size={16} /> Profile
                    </button>
                    {isUser(user.roles) && (
                        <button
                            role="tab"
                            aria-selected={activeTab === "bookings"}
                            onClick={() => setActiveTab("bookings")}
                            className={cn(styles.tab, activeTab === "bookings" && styles.tabActive)}
                        >
                            <Ticket size={16} /> My Bookings
                        </button>
                    )}
                    <button
                        role="tab"
                        aria-selected={activeTab === "security"}
                        onClick={() => setActiveTab("security")}
                        className={cn(styles.tab, activeTab === "security" && styles.tabActive)}
                    >
                        <Shield size={16} /> Security
                    </button>
                </nav>

                {/* Content Area */}
                <div className={styles.content} role="tabpanel">
                    {activeTab === "general" && (
                        <form onSubmit={handleProfileUpdate} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, fullName: e.target.value })
                                        }
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Phone Number</label>
                                    <div className={styles.inputWithIcon}>
                                        <Phone size={14} className={styles.inputIcon} />
                                        <input
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phoneNumber: e.target.value })
                                            }
                                            className={cn(styles.input, styles.inputPadded)}
                                        />
                                    </div>
                                </div>

                                {/* Manager-only fields */}
                                {isManager(user.roles) && (
                                    <>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Organization Name</label>
                                            <div className={styles.inputWithIcon}>
                                                <Building2 size={14} className={styles.inputIcon} />
                                                <input
                                                    type="text"
                                                    value={formData.organizationName}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            organizationName: e.target.value,
                                                        })
                                                    }
                                                    className={cn(styles.input, styles.inputPadded)}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>GST Number</label>
                                            <div className={styles.inputWithIcon}>
                                                <FileText size={14} className={styles.inputIcon} />
                                                <input
                                                    type="text"
                                                    value={formData.gstNumber}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, gstNumber: e.target.value })
                                                    }
                                                    className={cn(styles.input, styles.inputPadded)}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Designation</label>
                                            <input
                                                type="text"
                                                value={formData.designation}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, designation: e.target.value })
                                                }
                                                className={styles.input}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Website</label>
                                            <div className={styles.inputWithIcon}>
                                                <Globe size={14} className={styles.inputIcon} />
                                                <input
                                                    type="url"
                                                    value={formData.website}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, website: e.target.value })
                                                    }
                                                    className={cn(styles.input, styles.inputPadded)}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className={styles.formFooter}>
                                <button type="submit" disabled={saving} className={styles.submitButton}>
                                    {saving ? (
                                        <Loader2 size={16} className={styles.spinner} />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    Save Profile
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === "bookings" && isUser(user.roles) && (
                        <div className={styles.bookingsSection}>
                            <h3 className={styles.sectionTitle}>
                                <Ticket size={20} /> Latest Bookings
                            </h3>

                            {bookings.length > 0 ? (
                                <div className={styles.bookingsList}>
                                    {bookings.map((booking) => (
                                        <div key={booking.bookingId} className={styles.bookingCard}>
                                            <div className={styles.bookingInfo}>
                                                <div className={styles.bookingIcon}>
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <h4 className={styles.bookingTitle}>
                                                        {booking.eventName || "Event"}
                                                    </h4>
                                                    <p className={styles.bookingMeta}>
                                                        {booking.seatCount} seat(s)
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={styles.bookingActions}>
                                                <span
                                                    className={cn(
                                                        styles.statusBadge,
                                                        booking.status === "Confirmed" && styles.statusConfirmed,
                                                        booking.status === "PendingPayment" && styles.statusPending
                                                    )}
                                                >
                                                    {booking.status}
                                                </span>
                                                <button className={styles.iconButton} aria-label="View details">
                                                    <ExternalLink size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <p>No bookings found.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "security" && (
                        <form onSubmit={handlePasswordChange} className={styles.securityForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                    }
                                    placeholder="Enter current password"
                                    className={styles.input}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                                    }
                                    placeholder="Enter new password (min 8 characters)"
                                    className={styles.input}
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                    }
                                    placeholder="Confirm new password"
                                    className={styles.input}
                                    required
                                />
                            </div>

                            <button type="submit" disabled={saving} className={styles.passwordButton}>
                                {saving ? <Loader2 size={16} className={styles.spinner} /> : null}
                                Change Password
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer Metadata */}
                <footer className={styles.footer}>
                    <div className={styles.metaCard}>
                        <div className={styles.metaIcon}>
                            <Shield size={18} />
                        </div>
                        <div>
                            <p className={styles.metaLabel}>Account ID</p>
                            <p className={styles.metaValue}>{user.userId}</p>
                        </div>
                    </div>

                    <div className={styles.metaCard}>
                        <div className={styles.metaIcon}>
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className={styles.metaLabel}>Member Since</p>
                            <p className={styles.metaValue}>
                                {user.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                      })
                                    : "N/A"}
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
