"use client";

import React, { useEffect, useId } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            "w-screen bg-white shadow-2xl border-l border-border-main flex flex-col transform transition-transform duration-300 ease-in-out",
            "animate-in slide-in-from-right duration-300",
            sizeClasses[size]
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-neutral-100 px-6 py-4">
            <div>
              {title && (
                <h2
                  id={titleId}
                  className="font-serif font-semibold text-xl text-brand leading-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="text-xs text-muted mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="p-1 rounded-md text-text-placeholder hover:text-text-main hover:bg-surface-hover transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 p-6 overflow-y-auto">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 border-t border-neutral-100 bg-neutral-25 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
