/**
 * axiosClient.ts
 * Axios instance với JWT interceptor + base URL từ env.
 * Tự động đính kèm Bearer token và xử lý 401 logout.
 */

import axios from "axios";

const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
});

// ─── Request interceptor: đính kèm JWT & xử lý FormData ─────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("spc_access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Nếu request gửi FormData, xóa Content-Type để trình duyệt tự tạo multipart/form-data kèm boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
        config.headers.delete("content-type");
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: xử lý 401 & Mất kết nối máy chủ ───────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      if (error.response?.status === 401) {
        localStorage.removeItem("spc_access_token");
        localStorage.removeItem("spc_user");
        window.location.href = "/login";
      } else if (!error.response || error.code === "ERR_NETWORK" || error.code === "ECONNABORTED") {
        window.dispatchEvent(
          new CustomEvent("spc-network-error", {
            detail: {
              message: "Không thể kết nối đến máy chủ SmartPetCare. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.",
            },
          })
        );
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
