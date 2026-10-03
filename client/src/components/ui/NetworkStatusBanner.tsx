"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { AlertTriangle, WifiOff, RefreshCw, X, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function NetworkStatusBanner() {
  const { error: showToastError, success: showToastSuccess } = useToast();
  const [networkState, setNetworkState] = useState<"healthy" | "offline" | "server-down">("healthy");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const lastToastTimeRef = useRef<number>(0);

  const triggerErrorState = useCallback((type: "offline" | "server-down", msg: string) => {
    setNetworkState(type);
    setErrorMessage(msg);
    setIsDismissed(false);

    // Throttle toasts to once every 10 seconds to avoid spamming the user
    const now = Date.now();
    if (now - lastToastTimeRef.current > 10000) {
      lastToastTimeRef.current = now;
      showToastError(msg, type === "offline" ? "Mất kết nối Internet" : "Lỗi kết nối máy chủ");
    }
  }, [showToastError]);

  const restoreHealthyState = useCallback(() => {
    setNetworkState((prev) => {
      if (prev !== "healthy") {
        showToastSuccess("Đã kết nối lại hệ thống thành công!", "Đã khôi phục");
        // Show healthy state momentarily
        setTimeout(() => {
          setIsDismissed(true);
        }, 3000);
      }
      return "healthy";
    });
  }, [showToastSuccess]);

  useEffect(() => {
    // Check initial browser connection status
    if (typeof window !== "undefined" && !navigator.onLine) {
      triggerErrorState("offline", "Thiết bị của bạn đang ngoại tuyến. Vui lòng kiểm tra lại kết nối mạng.");
    }

    const handleOffline = () => {
      triggerErrorState("offline", "Mất kết nối Internet. Vui lòng kiểm tra đường truyền Wi-Fi hoặc mạng di động.");
    };

    const handleOnline = () => {
      restoreHealthyState();
    };

    const handleNetworkError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const msg = customEvent.detail?.message || "Không thể kết nối đến máy chủ SmartPetCare. Vui lòng kiểm tra lại kết nối máy chủ.";
      triggerErrorState("server-down", msg);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("spc-network-error", handleNetworkError);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("spc-network-error", handleNetworkError);
    };
  }, [triggerErrorState, restoreHealthyState]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${baseUrl}/health`, { method: "GET", cache: "no-store" }).catch(() => null);
      if (res && (res.ok || res.status === 404)) {
        restoreHealthyState();
      } else {
        triggerErrorState("server-down", "Máy chủ chưa sẵn sàng. Đang tiếp tục thử lại...");
      }
    } catch {
      triggerErrorState("server-down", "Vẫn không thể kết nối tới máy chủ.");
    } finally {
      setIsRetrying(false);
    }
  };

  if (isDismissed && networkState === "healthy") {
    return null;
  }

  if (networkState === "healthy" && !isDismissed) {
    return null;
  }

  if (isDismissed) {
    // Show a small discreet floating icon when dismissed so user still knows connection is down
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-rose-600 rounded-full shadow-lg hover:bg-rose-700 transition"
        title="Bấm để xem thông báo mất kết nối máy chủ"
      >
        <WifiOff className="w-4 h-4 animate-pulse" />
        <span>Mất kết nối máy chủ</span>
      </button>
    );
  }

  return (
    <aside
      aria-label="Cảnh báo trạng thái kết nối"
      className="sticky top-0 z-50 w-full transition-all duration-300"
    >
      <div
        className={`px-4 py-2.5 sm:px-6 shadow-md border-b backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-sm font-medium ${
          networkState === "healthy"
            ? "bg-emerald-600/95 text-white border-emerald-700"
            : networkState === "offline"
            ? "bg-amber-600/95 text-white border-amber-700"
            : "bg-rose-600/95 text-white border-rose-700"
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          {networkState === "healthy" ? (
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-100" />
          ) : networkState === "offline" ? (
            <WifiOff className="w-5 h-5 shrink-0 text-amber-200 animate-pulse" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-200 animate-pulse" />
          )}
          <span>
            {networkState === "healthy"
              ? "Kết nối máy chủ đã được khôi phục!"
              : errorMessage || "Không thể kết nối đến máy chủ SmartPetCare. Vui lòng kiểm tra lại kết nối mạng."}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {networkState !== "healthy" && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-white/20 hover:bg-white/30 active:bg-white/40 text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Đang kết nối..." : "Thử lại"}
            </button>
          )}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md hover:bg-white/20 text-white/80 hover:text-white transition"
            aria-label="Đóng cảnh báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default NetworkStatusBanner;
