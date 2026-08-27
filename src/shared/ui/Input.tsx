import React, { useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  isMono?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  isMono = false,
  leftIcon,
  rightIcon,
  className,
  id: customId,
  disabled,
  required,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-text-main flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-error" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-text-placeholder pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined
          }
          className={cn(
            "w-full h-10 px-3 bg-white border border-border-main rounded-md text-sm text-text-main placeholder-text-placeholder",
            "transition-colors duration-150 ease-in-out",
            "focus:outline-2 focus:outline-offset-0 focus:outline-focus-ring focus:border-accent",
            "disabled:bg-surface-disabled disabled:text-text-placeholder disabled:cursor-not-allowed disabled:border-border-main",
            isMono && "font-mono tracking-tight",
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            error && "border-error focus:border-error focus:outline-error",
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 text-text-placeholder pointer-events-none flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>

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
