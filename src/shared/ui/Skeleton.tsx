import React from "react";
import { cn } from "@/shared/lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circle" | "rect" | "card";
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({
  variant = "rect",
  width,
  height,
  count = 1,
  className,
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded-md w-full",
    circle: "rounded-full aspect-square",
    rect: "rounded-md w-full h-10",
    card: "rounded-md w-full h-32 border border-border-main",
  };

  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={cn(
            "bg-neutral-100 animate-pulse shrink-0",
            variantClasses[variant],
            className
          )}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
            ...style,
          }}
          aria-hidden="true"
          {...props}
        />
      ))}
    </>
  );
}
