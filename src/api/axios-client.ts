/**
 * Axios client with automatic token refresh
 * Handles 401 errors by refreshing tokens and retrying requests
 */

import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "./client";
import { navigateTo } from "../utils/navigation";

// Create axios instance
// Use a factory function to allow proper mocking in tests
function createAxiosClient() {
  return axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Always include cookies
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export const axiosClient = createAxiosClient();

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - add auth headers if needed
axiosClient.interceptors.request.use(
  (config) => {
    // Cookies are automatically included with withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors and refresh tokens
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const refreshResponse = await fetch(`${API_BASE_URL}/v1/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (refreshResponse.ok) {
          // Token refreshed, retry original request
          processQueue(null, null);
          return axiosClient(originalRequest);
        } else {
          // Refresh failed, redirect to login
          processQueue(error, null);
          navigateTo("/login");
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(error, null);
        navigateTo("/login");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
