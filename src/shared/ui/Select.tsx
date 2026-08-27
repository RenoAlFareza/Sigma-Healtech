import React, { useId } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  className,
  id: customId,
  disabled,
  required,
  value,
  defaultValue,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = customId || generatedId;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-text-main flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-error" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          id={selectId}
          disabled={disabled}
          required={required}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined
          }
          className={cn(
            "w-full h-10 pl-3 pr-9 bg-white border border-border-main rounded-md text-sm text-text-main appearance-none cursor-pointer",
            "transition-colors duration-150 ease-in-out",
            "focus:outline-2 focus:outline-offset-0 focus:outline-focus-ring focus:border-accent",
            "disabled:bg-surface-disabled disabled:text-text-placeholder disabled:cursor-not-allowed disabled:border-border-main",
            error && "border-error focus:border-error focus:outline-error",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className="absolute right-3 w-4 h-4 text-text-placeholder pointer-events-none shrink-0"
          aria-hidden="true"
        />
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
