import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary on module load
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadResponse {
    success: boolean;
    data?: {
        url: string;
        publicId: string;
        thumbnailUrl: string;
        avatarUrl: string;
    };
    error?: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function generateTransformationUrl(publicId: string, width: number, height: number): string {
    return cloudinary.url(publicId, {
        transformation: [
            { width, height, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
    });
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
    try {
        // Verify Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET) {
            console.error('[Cloudinary] Missing configuration');
            return NextResponse.json(
                { success: false, error: 'Cloudinary not configured' },
                { status: 500 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folder = formData.get('folder') as string || 'arenaops/uploads';
        const publicId = formData.get('publicId') as string | null;

        // Validate file exists
        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Allowed: JPG, PNG, WebP' },
                { status: 400 }
            );
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'File too large. Max 5MB' },
                { status: 400 }
            );
        }

        // Convert File to base64 for Cloudinary upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Build upload options
        const uploadOptions: Record<string, unknown> = {
            folder,
            resource_type: 'image',
            overwrite: true,
            transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
            ],
        };

        // If publicId provided, use it (for updates/replacements)
        if (publicId) {
            uploadOptions.public_id = publicId;
        }

        // Upload to Cloudinary
        const result: UploadApiResponse = await cloudinary.uploader.upload(base64Data, uploadOptions);

        // Generate transformation URLs
        const thumbnailUrl = generateTransformationUrl(result.public_id, 150, 150);
        const avatarUrl = generateTransformationUrl(result.public_id, 80, 80);

        return NextResponse.json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                thumbnailUrl,
                avatarUrl,
            },
        });
    } catch (error) {
        console.error('[Cloudinary Upload Error]:', error);
        return NextResponse.json(
            { success: false, error: 'Upload failed' },
            { status: 500 }
        );
    }
}
