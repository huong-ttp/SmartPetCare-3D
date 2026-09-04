"use client";

import React, { useState, createContext, useContext, useCallback } from "react";
import { cn } from "@/utils/cn";
import { CheckCircle2, AlertCircle, Info, XCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

const ICONS = {
  success: <CheckCircle2 className="text-green-500" size={20} />,
  error: <XCircle className="text-red-500" size={20} />,
  warning: <AlertCircle className="text-amber-500" size={20} />,
  info: <Info className="text-[#0EA5B7]" size={20} />,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    if (toast.duration !== 0) {
      setTimeout(() => removeToast(id), toast.duration || 3000);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => showToast({ type: "success", message, title }), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast({ type: "error", message, title }), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast({ type: "info", message, title }), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast({ type: "warning", message, title }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl shadow-lg border w-80 max-w-[calc(100vw-2rem)] pointer-events-auto",
              "bg-white animate-in slide-in-from-right-8 fade-in duration-300",
              toast.type === "success" && "border-green-100",
              toast.type === "error" && "border-red-100",
              toast.type === "warning" && "border-amber-100",
              toast.type === "info" && "border-cyan-100"
            )}
            role="alert"
          >
            <div className="shrink-0 mt-0.5">{ICONS[toast.type]}</div>
            <div className="flex-1 min-w-0">
              {toast.title && <h4 className="text-sm font-semibold text-slate-900">{toast.title}</h4>}
              <p className="text-sm text-slate-600 line-clamp-3">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 -mr-2 -mt-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
