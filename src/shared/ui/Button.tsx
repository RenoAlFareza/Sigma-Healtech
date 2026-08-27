import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  type = "button",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50 select-none rounded-md";

  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover active:bg-accent shadow-xs",
    secondary: "bg-brand text-white hover:bg-core-800 active:bg-core-950 shadow-xs",
    outline:
      "border border-border-main bg-white text-text-main hover:bg-surface-hover hover:border-neutral-400 active:bg-neutral-100",
    danger: "bg-error text-white hover:bg-error active:bg-error shadow-xs",
    ghost: "bg-transparent text-text-main hover:bg-surface-hover active:bg-neutral-100",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2.5",
  };

  const isButtonDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isButtonDisabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0 inline-flex">{rightIcon}</span>}
    </button>
  );
}
