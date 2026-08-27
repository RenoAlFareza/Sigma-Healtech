import React from "react";
import { PackageX } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-md border border-dashed border-border-main bg-neutral-25 my-4",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-alert-light text-accent flex items-center justify-center mb-3 shrink-0">
        {icon || <PackageX className="w-6 h-6 stroke-[1.75]" aria-hidden="true" />}
      </div>

      <h4 className="font-serif font-semibold text-lg text-brand mb-1">
        {title}
      </h4>

      {description && (
        <p className="text-xs text-muted max-w-md leading-relaxed mb-4">
          {description}
        </p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
