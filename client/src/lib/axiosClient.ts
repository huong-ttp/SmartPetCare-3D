/**
 * axiosClient.ts
 * Axios instance với JWT interceptor + base URL từ env.
 * Tự động đính kèm Bearer token và xử lý 401 logout.
 */

import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor: đính kèm JWT ───────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("spc_access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: xử lý 401 ────────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("spc_access_token");
      localStorage.removeItem("spc_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
