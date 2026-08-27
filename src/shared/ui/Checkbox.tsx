import React, { useId } from "react";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export function Checkbox({
  label,
  description,
  error,
  className,
  id: customId,
  disabled,
  checked,
  defaultChecked,
  onChange,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = customId || generatedId;
  const errorId = `${checkboxId}-error`;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="inline-flex items-start gap-2.5 cursor-pointer group">
        <div className="relative flex items-center pt-0.5">
          <input
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={onChange}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "w-4 h-4 rounded-md border border-border-main bg-white flex items-center justify-center transition-all duration-150",
              "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring",
              "peer-checked:bg-accent peer-checked:border-accent peer-checked:text-white",
              "peer-disabled:bg-surface-disabled peer-disabled:border-border-main peer-disabled:cursor-not-allowed",
              error && "border-error"
            )}
          >
            <Check className="w-3 h-3 stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" aria-hidden="true" />
          </div>
        </div>

        {(label || description) && (
          <label htmlFor={checkboxId} className="flex flex-col cursor-pointer select-none text-xs">
            {label && (
              <span className={cn("font-medium text-text-main", disabled && "text-text-placeholder")}>
                {label}
              </span>
            )}
            {description && (
              <span className={cn("text-muted", disabled && "text-text-placeholder")}>
                {description}
              </span>
            )}
          </label>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-xs text-error flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
