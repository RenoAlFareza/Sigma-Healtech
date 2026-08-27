import React, { useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({
  label,
  error,
  hint,
  className,
  id: customId,
  disabled,
  required,
  rows = 3,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = customId || generatedId;
  const errorId = `${textareaId}-error`;
  const hintId = `${textareaId}-hint`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold text-text-main flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-error" aria-hidden="true">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        disabled={disabled}
        required={required}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined
        }
        className={cn(
          "w-full px-3 py-2 bg-white border border-border-main rounded-md text-sm text-text-main placeholder-text-placeholder resize-y",
          "transition-colors duration-150 ease-in-out",
          "focus:outline-2 focus:outline-offset-0 focus:outline-focus-ring focus:border-accent",
          "disabled:bg-surface-disabled disabled:text-text-placeholder disabled:cursor-not-allowed disabled:border-border-main",
          error && "border-error focus:border-error focus:outline-error",
          className
        )}
        {...props}
      />

      {error ? (
        <p id={errorId} className="text-xs text-error flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted mt-0.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
