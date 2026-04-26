import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// 🔥 Use backend directly (NO BFF)
const API = process.env.NEXT_PUBLIC_API_URL;

// Safety check (prevents silent failures)
if (!API) {
  throw new Error("❌ NEXT_PUBLIC_API_URL is not defined");
}

// ✅ Axios instance
export const api = axios.create({
  baseURL: API, // 👉 http://13.60.206.243
  withCredentials: true, // required for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────────────────────
// 🔁 Token refresh handling (optional but kept from your logic)
// ─────────────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

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

// 🔁 Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // ❌ No response → network/backend down
    if (!error.response) {
      console.error("❌ Network error / backend not reachable");
      return Promise.reject(error);
    }

    // 🔒 Handle 401 (token expired)
    if (error.response.status === 401 && !originalRequest._retry) {
      // Token revoked → force logout
      if ((error.response.data as any)?.error?.code === 'TOKEN_REVOKED') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Queue requests while refreshing
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 🔁 Refresh token (IMPORTANT: direct backend call)
        await axios.post(`${API}/auth/refresh`, {}, {
          withCredentials: true,
        });

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





// import axios from 'axios';

// // Routes through the Next.js BFF proxy at /api/auth/[...slug] and /api/core/[...slug]
// // The proxy forwards requests to the actual backend services (localhost:5001, localhost:5007)
// // Authentication is handled via HttpOnly cookies — withCredentials ensures they are sent on every request
// const isServer = typeof window === 'undefined';

// export const api = axios.create({
//     baseURL: isServer
//         ? process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
//         : '',
//     withCredentials: true,
//     headers: {
//         'Content-Type': 'application/json',
//     },
// });

// // No request interceptor needed — the browser automatically sends HttpOnly cookies

// // Response interceptor: auto-refresh on 401
// let isRefreshing = false;
// let failedQueue: Array<{ resolve: () => void; reject: (reason?: unknown) => void }> = [];

// const processQueue = (error: unknown) => {
//     failedQueue.forEach((prom) => {
//         if (error) {
//             prom.reject(error);
//         } else {
//             prom.resolve();
//         }
//     });
//     failedQueue = [];
// };

// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         if (error.response?.status === 401 && !originalRequest._retry) {
//             // Token blacklisted — clear session and redirect to login immediately
//             if (error.response?.data?.error?.code === 'TOKEN_REVOKED') {
//                 if (typeof window !== 'undefined') {
//                     localStorage.removeItem('user');
//                     window.location.href = '/login';
//                 }
//                 return Promise.reject(error);
//             }

//             // Queue concurrent requests while a refresh is in progress
//             if (isRefreshing) {
//                 return new Promise<void>((resolve, reject) => {
//                     failedQueue.push({ resolve, reject });
//                 })
//                     .then(() => api(originalRequest))
//                     .catch((err) => Promise.reject(err));
//             }

//             originalRequest._retry = true;
//             isRefreshing = true;

//             try {
//                 // Cookie is sent automatically — no body or token needed
//                 await axios.post('/api/auth/refresh', {}, { withCredentials: true });
//                 processQueue(null);
//                 return api(originalRequest);
//             } catch (refreshError) {
//                 processQueue(refreshError);
//                 if (typeof window !== 'undefined') {
//                     localStorage.removeItem('user');
//                     window.location.href = '/login';
//                 }
//                 return Promise.reject(refreshError);
//             } finally {
//                 isRefreshing = false;
//             }
//         }

//         return Promise.reject(error);
//     }
// );
