import React from "react";
import { cn } from "@/shared/lib/cn";

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "card";
}

export function Card({
  title,
  subtitle,
  headerAction,
  footer,
  padding = "md",
  shadow = "card",
  className,
  children,
  ...props
}: CardProps) {
  const paddingMap = {
    none: "p-0",
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  };

  const shadowMap = {
    none: "shadow-none",
    sm: "shadow-xs",
    card: "shadow-card",
  };

  const hasHeader = title || subtitle || headerAction;

  return (
    <div
      className={cn(
        "bg-white border border-border-main rounded-md flex flex-col overflow-hidden transition-shadow duration-200",
        shadowMap[shadow],
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div className="flex items-start justify-between border-b border-neutral-100 px-5 py-4 gap-4">
          <div>
            {title && (
              <h3 className="font-serif font-semibold text-lg text-brand leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className={cn("flex-1", paddingMap[padding])}>{children}</div>

      {footer && (
        <div className="border-t border-neutral-100 bg-neutral-25 px-5 py-3 rounded-b-md">
          {footer}
        </div>
      )}
    </div>
  );
}
