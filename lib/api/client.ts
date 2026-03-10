import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { handleApiError } from './error-handler';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance with timeout
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  withCredentials: true, // CRITICAL: send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent infinite loop
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Request interceptor for logging in development
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => {      
      return Promise.reject(error);
    }
  );
}

// Paths where forceLogout should not redirect (already public/auth pages)
const AUTH_PATHS = ['/', '/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/profile/'];

// Clear session cookies and redirect to login page
async function forceLogout(reason?: string) {
  if (typeof window === 'undefined') return;
  const currentPath = window.location.pathname;
  if (AUTH_PATHS.some((p) => p === '/' ? currentPath === p : currentPath.startsWith(p))) return;

  try {
    // Clear httpOnly cookies server-side so middleware doesn't loop
    await axios.post(
      `${API_BASE_URL}/auth/clear-session`,
      {},
      { withCredentials: true, timeout: 5000 },
    );
  } catch {
    // If clear-session fails, redirect anyway
  }

  const url = reason
    ? `/login?reason=${encodeURIComponent(reason)}`
    : '/login';
  window.location.href = url;
}

// Response interceptor for automatic token refresh and error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('🟢 API Response:', {
    //     method: response.config.method?.toUpperCase(),
    //     url: response.config.url,
    //     status: response.status,
    //     data: response.data,
    //   });
    // }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 403 - Forbidden (blocked account) — JWT strategy throws this
    if (
      error.response?.status === 403 &&
      !originalRequest?.url?.includes('/auth/clear-session')
    ) {
      const msg = (error.response?.data as any)?.message || '';
      if (msg.includes('заблокирован') || msg.includes('blocked')) {
        await forceLogout('blocked');
        handleApiError(error);
        return Promise.reject(error);
      }
    }

    // Handle 401 - Unauthorized (token refresh logic)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register')
    ) {
      if (isRefreshing) {
        // If already refreshing, add to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh access token
        await apiClient.post('/auth/refresh');

        processQueue(null);
        isRefreshing = false;

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        isRefreshing = false;

        // Clear cookies then redirect — prevents middleware loop
        await forceLogout();

        return Promise.reject(refreshError);
      }
    }

    // Suppress toast for /auth/refresh 401 — handled silently by forceLogout
    if (!(error.response?.status === 401 && originalRequest?.url?.includes('/auth/refresh'))) {
      handleApiError(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
