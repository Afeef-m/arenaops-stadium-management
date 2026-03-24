// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadResponse {
    success: boolean;
    data?: {
        url: string;
        publicId: string;
        thumbnailUrl: string;
        avatarUrl: string;
    };
    error?: string;
}

export interface UploadOptions {
    folder?: string;
    publicId?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const uploadService = {
    /**
     * Upload an image to Cloudinary via the BFF proxy
     * @param file - The File object to upload
     * @param options - Optional folder and publicId for organization
     * @returns UploadResponse with Cloudinary URLs
     */
    uploadImage: async (file: File, options?: UploadOptions): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        if (options?.folder) {
            formData.append('folder', options.folder);
        }

        if (options?.publicId) {
            formData.append('publicId', options.publicId);
        }

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        const data: UploadResponse = await response.json();
        return data;
    },

    /**
     * Upload a profile picture with user-specific folder organization
     * @param file - The image file
     * @param userId - User ID for folder organization
     * @returns UploadResponse with profile-optimized URLs
     */
    uploadProfilePicture: async (file: File, userId: string): Promise<UploadResponse> => {
        return uploadService.uploadImage(file, {
            folder: `arenaops/profiles/${userId}`,
            publicId: 'avatar', // Always 'avatar' so it overwrites on update
        });
    },

    /**
     * Upload an event image
     * @param file - The image file
     * @param eventId - Event ID for folder organization
     * @returns UploadResponse with event image URLs
     */
    uploadEventImage: async (file: File, eventId: string): Promise<UploadResponse> => {
        return uploadService.uploadImage(file, {
            folder: `arenaops/events/${eventId}`,
            publicId: 'cover',
        });
    },

    /**
     * Upload a stadium image
     * @param file - The image file
     * @param stadiumId - Stadium ID for folder organization
     * @returns UploadResponse with stadium image URLs
     */
    uploadStadiumImage: async (file: File, stadiumId: string): Promise<UploadResponse> => {
        return uploadService.uploadImage(file, {
            folder: `arenaops/stadiums/${stadiumId}`,
            publicId: 'cover',
        });
    },
};
