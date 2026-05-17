import axios from "axios";
import { toast } from "sonner";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
});

// Toggle auto-refresh behavior in development via NEXT_PUBLIC_ENABLE_AUTO_REFRESH
const AUTO_REFRESH = (process.env.NEXT_PUBLIC_ENABLE_AUTO_REFRESH ?? "true") === "true";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (err?: any) => void;
}> = [];

const processQueue = (error: any, token: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!AUTO_REFRESH) return Promise.reject(error);
    const originalRequest = error.config;

    if (error.response?.status === 401 && typeof window !== "undefined") {
      // don't try to refresh if the failing request was the refresh call itself
      if (originalRequest && originalRequest.url?.includes("/auth/refresh")) {
        toast.error("Session expired — please log in again");
        setTimeout(() => window.location.replace("/login"), 120);
        return Promise.reject(error);
      }

      if (originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => api.request(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
          processQueue(null, true);
          return api.request(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          toast.error("Session expired — please log in again");
          setTimeout(() => window.location.replace("/login"), 120);
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  },
);
