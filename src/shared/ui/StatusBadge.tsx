import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type MedicalStatusType =
  | "IN_STOCK"
  | "APPROVED"
  | "DELIVERED"
  | "ACTIVE"
  | "COMPLETED"
  | "SUCCESS"
  | "LOW_STOCK"
  | "EXPIRING"
  | "PENDING_REVIEW"
  | "PARTIAL"
  | "WARNING"
  | "STOCKOUT"
  | "EXPIRED"
  | "REJECTED"
  | "CANCELLED"
  | "CRITICAL"
  | "ERROR"
  | "PENDING"
  | "DRAFT"
  | "IN_TRANSIT"
  | "PROCESSING"
  | "INFO";

export interface StatusBadgeProps {
  status: MedicalStatusType | string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
  customIcon?: React.ReactNode;
}

const statusConfigs: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
    defaultLabel: string;
  }
> = {
  // Success statuses
  IN_STOCK: {
    bg: "bg-success-light",
    text: "text-success",
    border: "border-success/20",
    icon: CheckCircle2,
    defaultLabel: "In Stock",
  },
  APPROVED: {
    bg: "bg-success-light",
    text: "text-success",
    border: "border-success/20",
    icon: CheckCircle2,
    defaultLabel: "Approved",
  },
  DELIVERED: {
    bg: "bg-success-light",
    text: "text-success",
    border: "border-success/20",
    icon: CheckCircle2,
    defaultLabel: "Delivered",
  },
  ACTIVE: {
    bg: "bg-success-light",
    text: "text-success",
    border: "border-success/20",
    icon: CheckCircle2,
    defaultLabel: "Active",
  },
  COMPLETED: {
    bg: "bg-success-light",
    text: "text-success",
    border: "border-success/20",
    icon: CheckCircle2,
    defaultLabel: "Completed",
  },
  SUCCESS: {
    bg: "bg-success-light",
    text: "text-success",
    border: "border-success/20",
    icon: CheckCircle2,
    defaultLabel: "Success",
  },

  // Warning statuses
  LOW_STOCK: {
    bg: "bg-warning-light",
    text: "text-warning",
    border: "border-warning/20",
    icon: AlertTriangle,
    defaultLabel: "Low Stock",
  },
  EXPIRING: {
    bg: "bg-warning-light",
    text: "text-warning",
    border: "border-warning/20",
    icon: AlertTriangle,
    defaultLabel: "Expiring Soon",
  },
  PENDING_REVIEW: {
    bg: "bg-warning-light",
    text: "text-warning",
    border: "border-warning/20",
    icon: AlertTriangle,
    defaultLabel: "Needs Review",
  },
  PARTIAL: {
    bg: "bg-warning-light",
    text: "text-warning",
    border: "border-warning/20",
    icon: AlertTriangle,
    defaultLabel: "Partial",
  },
  WARNING: {
    bg: "bg-warning-light",
    text: "text-warning",
    border: "border-warning/20",
    icon: AlertTriangle,
    defaultLabel: "Warning",
  },

  // Error statuses
  STOCKOUT: {
    bg: "bg-error-light",
    text: "text-error",
    border: "border-error/20",
    icon: XCircle,
    defaultLabel: "Stockout",
  },
  EXPIRED: {
    bg: "bg-error-light",
    text: "text-error",
    border: "border-error/20",
    icon: ShieldAlert,
    defaultLabel: "Expired",
  },
  REJECTED: {
    bg: "bg-error-light",
    text: "text-error",
    border: "border-error/20",
    icon: XCircle,
    defaultLabel: "Rejected",
  },
  CANCELLED: {
    bg: "bg-error-light",
    text: "text-error",
    border: "border-error/20",
    icon: XCircle,
    defaultLabel: "Cancelled",
  },
  CRITICAL: {
    bg: "bg-error-light",
    text: "text-error",
    border: "border-error/20",
    icon: ShieldAlert,
    defaultLabel: "Critical",
  },
  ERROR: {
    bg: "bg-error-light",
    text: "text-error",
    border: "border-error/20",
    icon: XCircle,
    defaultLabel: "Error",
  },

  // Info / Neutral statuses
  PENDING: {
    bg: "bg-alert-light",
    text: "text-alert",
    border: "border-alert/20",
    icon: Clock,
    defaultLabel: "Pending",
  },
  DRAFT: {
    bg: "bg-neutral-100",
    text: "text-muted",
    border: "border-border-main",
    icon: Info,
    defaultLabel: "Draft",
  },
  IN_TRANSIT: {
    bg: "bg-alert-light",
    text: "text-alert",
    border: "border-alert/20",
    icon: Clock,
    defaultLabel: "In Transit",
  },
  PROCESSING: {
    bg: "bg-alert-light",
    text: "text-alert",
    border: "border-alert/20",
    icon: Clock,
    defaultLabel: "Processing",
  },
  INFO: {
    bg: "bg-alert-light",
    text: "text-alert",
    border: "border-alert/20",
    icon: Info,
    defaultLabel: "Info",
  },
};

const defaultConfig = {
  bg: "bg-neutral-100",
  text: "text-muted",
  border: "border-border-main",
  icon: Info,
  defaultLabel: "Unknown",
};

export function StatusBadge({
  status,
  label,
  size = "md",
  className,
  customIcon,
}: StatusBadgeProps) {
  const normalizedKey = String(status).toUpperCase().replace(/\s+/g, "_");
  const config = statusConfigs[normalizedKey] || defaultConfig;
  const IconComponent = config.icon;
  const displayLabel = label || config.defaultLabel;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1 h-5",
    md: "px-2.5 py-1 text-xs font-medium gap-1.5 h-6",
  };

  const iconSizes = {
    sm: "w-3 h-3 shrink-0",
    md: "w-3.5 h-3.5 shrink-0",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-solid font-medium tracking-wide whitespace-nowrap select-none",
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      {customIcon ? (
        <span className="shrink-0">{customIcon}</span>
      ) : (
        <IconComponent className={iconSizes[size]} aria-hidden="true" />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
