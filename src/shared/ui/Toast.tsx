"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string) => string;
    error: (message: string, title?: string) => string;
    warning: (message: string, title?: string) => string;
    info: (message: string, title?: string) => string;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, message, title, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toastHelpers = {
    success: (message: string, title?: string) => addToast({ type: "success", message, title }),
    error: (message: string, title?: string) => addToast({ type: "error", message, title }),
    warning: (message: string, title?: string) => addToast({ type: "warning", message, title }),
    info: (message: string, title?: string) => addToast({ type: "info", message, title }),
  };

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, toast: toastHelpers }}
    >
      {children}

      {/* Floating Toast Container */}
      <aside
        aria-label="Notifications"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const configs: Record<
    ToastType,
    { bg: string; border: string; text: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    success: {
      bg: "bg-white",
      border: "border-l-4 border-l-success border-border-main",
      text: "text-success",
      icon: CheckCircle2,
    },
    error: {
      bg: "bg-white",
      border: "border-l-4 border-l-error border-border-main",
      text: "text-error",
      icon: XCircle,
    },
    warning: {
      bg: "bg-white",
      border: "border-l-4 border-l-warning border-border-main",
      text: "text-warning",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-white",
      border: "border-l-4 border-l-alert border-border-main",
      text: "text-alert",
      icon: Info,
    },
  };

  const config = configs[toast.type];
  const IconComponent = config.icon;

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-md shadow-lg border text-sm transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in",
        config.bg,
        config.border
      )}
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <IconComponent className={cn("w-5 h-5 shrink-0 mt-0.5", config.text)} aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          {toast.title && (
            <h5 className="font-semibold text-xs text-text-main leading-tight">{toast.title}</h5>
          )}
          <p className="text-xs text-muted leading-relaxed break-words">{toast.message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss toast"
        className="text-text-placeholder hover:text-text-main p-0.5 rounded-md shrink-0 focus-visible:outline-2 focus-visible:outline-focus-ring"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
