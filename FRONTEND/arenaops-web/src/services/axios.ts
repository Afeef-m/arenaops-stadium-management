import axios from 'axios';

// Routes through the Next.js BFF proxy at /api/auth/[...slug] and /api/core/[...slug]
// The proxy forwards requests to the actual backend services (localhost:5001, localhost:5007)
// Authentication is handled via HttpOnly cookies — withCredentials ensures they are sent on every request
export const api = axios.create({
    baseURL: '',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// No request interceptor needed — the browser automatically sends HttpOnly cookies

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Token blacklisted — clear session and redirect to login immediately
            if (error.response?.data?.error?.code === 'TOKEN_REVOKED') {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            // Queue concurrent requests while a refresh is in progress
            if (isRefreshing) {
                return new Promise<void>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Cookie is sent automatically — no body or token needed
                await axios.post('/api/auth/refresh', {}, { withCredentials: true });
                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
