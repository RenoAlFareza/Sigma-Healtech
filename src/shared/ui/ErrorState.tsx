import React from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export function ErrorState({
  title = "System Error",
  message,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-md border border-error/30 bg-error-light/40 my-4",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-error-light text-error flex items-center justify-center mb-3 shrink-0 border border-error/20">
        <AlertOctagon className="w-6 h-6 stroke-[1.75]" aria-hidden="true" />
      </div>

      <h4 className="font-serif font-semibold text-lg text-error mb-1">
        {title}
      </h4>

      <p className="text-xs text-muted max-w-md leading-relaxed mb-4">
        {message}
      </p>

      <div className="flex items-center gap-3 mt-1">
        {onRetry && (
          <Button variant="danger" size="sm" onClick={onRetry} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
            Try Again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
