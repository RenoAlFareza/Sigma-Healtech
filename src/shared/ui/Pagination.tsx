"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "./Button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : undefined;
  const endItem =
    totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : undefined;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-100 pt-4 text-xs text-muted",
        className
      )}
    >
      {/* Item range info */}
      <div className="flex items-center gap-3">
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <strong className="font-semibold text-text-main font-mono">{startItem}</strong> to{" "}
            <strong className="font-semibold text-text-main font-mono">{endItem}</strong> of{" "}
            <strong className="font-semibold text-text-main font-mono">{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="font-semibold text-text-main font-mono">{currentPage}</strong> of{" "}
            <strong className="font-semibold text-text-main font-mono">{totalPages || 1}</strong>
          </span>
        )}

        {pageSize && onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
              className="h-7 px-2 bg-white border border-border-main rounded-md text-xs font-mono text-text-main focus:outline-focus-ring"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          aria-label="First page"
          className="w-8 h-8 p-0 min-w-0"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="w-8 h-8 p-0 min-w-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((page, index) => {
            if (typeof page === "string") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-text-placeholder">
                  ...
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "w-8 h-8 rounded-md text-xs font-mono font-medium transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring",
                  isCurrent
                    ? "bg-accent text-white font-bold"
                    : "text-text-main hover:bg-surface-hover border border-border-main"
                )}
              >
                {page}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="w-8 h-8 p-0 min-w-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          aria-label="Last page"
          className="w-8 h-8 p-0 min-w-0"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </nav>
  );
}
