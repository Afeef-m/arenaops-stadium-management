import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001/api/auth';

// Headers that should NOT be forwarded to the backend
const HOP_BY_HOP_HEADERS = ['host', 'connection', 'expect', 'transfer-encoding', 'keep-alive', 'upgrade'];

// Get the base URL without the /api/auth suffix for profile routes
function getAuthServiceBase(): string {
    const url = AUTH_SERVICE_URL;
    // Remove /api/auth suffix to get base URL for building other routes
    if (url.endsWith('/api/auth')) {
        return url.slice(0, -9); // Remove "/api/auth"
    }
    // Fallback for localhost format
    return url.replace('/api/auth', '');
}

async function handleProxy(request: NextRequest, slug: string[]) {
    const slugPath = slug.join('/');

    // Route profile/* requests to /api/profile/* on the auth service
    let url: string;
    if (slugPath.startsWith('profile')) {
        const baseUrl = getAuthServiceBase();
        url = `${baseUrl}/api/${slugPath}${request.nextUrl.search}`;
    } else {
        url = `${AUTH_SERVICE_URL}/${slugPath}${request.nextUrl.search}`;
    }

    // Build clean headers — strip hop-by-hop and problematic ones
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        if (!HOP_BY_HOP_HEADERS.includes(key.toLowerCase())) {
            headers[key] = value;
        }
    });
    headers['host'] = new URL(AUTH_SERVICE_URL).host;

    try {
        const body = ['GET', 'HEAD'].includes(request.method)
            ? undefined
            : await request.text();

        const response = await fetch(url, {
            method: request.method,
            headers: headers,
            body: body,
        });

        const responseBody = await response.text();

        const proxiedResponse = new NextResponse(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/json',
            },
        });

        // Forward all Set-Cookie headers so the browser receives the HttpOnly auth cookies
        const setCookies = response.headers.getSetCookie?.() ?? [];
        setCookies.forEach((cookie) => proxiedResponse.headers.append('Set-Cookie', cookie));

        return proxiedResponse;
    } catch (error) {
        console.error(`[BFF Auth Proxy Error]:`, error);
        return NextResponse.json({ error: 'Failed to proxy request to Auth Service' }, { status: 502 });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    return handleProxy(request, slug);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    return handleProxy(request, slug);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    return handleProxy(request, slug);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    return handleProxy(request, slug);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    return handleProxy(request, slug);
}
