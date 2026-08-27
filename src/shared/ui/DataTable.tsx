"use client";

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Checkbox } from "./Checkbox";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { Pagination, PaginationProps } from "./Pagination";

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  isMono?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (columnId: string, direction: "asc" | "desc") => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  pagination?: PaginationProps;
  onRowClick?: (item: T) => void;
  rowActions?: (item: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyText = "No records found",
  emptyIcon,
  emptyAction,
  sortColumn,
  sortDirection,
  onSort,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  pagination,
  onRowClick,
  rowActions,
  className,
}: DataTableProps<T>) {
  const allRowKeys = data.map(keyExtractor);
  const isAllSelected =
    data.length > 0 && allRowKeys.every((key) => selectedIds.includes(key));
  const isSomeSelected =
    data.length > 0 &&
    allRowKeys.some((key) => selectedIds.includes(key)) &&
    !isAllSelected;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      const remainingSelected = selectedIds.filter(
        (id) => !allRowKeys.includes(id)
      );
      onSelectionChange(remainingSelected);
    } else {
      const newSelected = Array.from(new Set([...selectedIds, ...allRowKeys]));
      onSelectionChange(newSelected);
    }
  };

  const handleSelectRow = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedIds.includes(key)) {
      onSelectionChange(selectedIds.filter((id) => id !== key));
    } else {
      onSelectionChange([...selectedIds, key]);
    }
  };

  const handleHeaderSort = (col: DataTableColumn<T>) => {
    if (!col.sortable || !onSort) return;
    if (sortColumn === col.id) {
      const nextDir = sortDirection === "asc" ? "desc" : "asc";
      onSort(col.id, nextDir);
    } else {
      onSort(col.id, "asc");
    }
  };

  const alignmentClasses = {
    left: "text-left justify-start",
    center: "text-center justify-center",
    right: "text-right justify-end",
  };

  return (
    <div className={cn("w-full flex flex-col gap-3", className)}>
      <div className="w-full overflow-x-auto rounded-md border border-border-main bg-white shadow-xs">
        <table className="w-full border-collapse text-xs text-text-main">
          <thead>
            <tr className="bg-brand text-white border-b border-border-main">
              {selectable && (
                <th className="w-10 px-3 py-3 text-center align-middle">
                  <Checkbox
                    checked={isAllSelected}
                    aria-label="Select all rows"
                    onChange={handleSelectAll}
                    className="justify-center"
                  />
                </th>
              )}

              {columns.map((col) => {
                const align = col.align || "left";
                const isSorted = sortColumn === col.id;

                return (
                  <th
                    key={col.id}
                    style={{ width: col.width }}
                    className={cn(
                      "px-4 py-3 font-semibold uppercase tracking-wider text-xs whitespace-nowrap select-none",
                      col.sortable && "cursor-pointer hover:bg-core-800 transition-colors"
                    )}
                    onClick={() => handleHeaderSort(col)}
                  >
                    <div className={cn("flex items-center gap-1.5", alignmentClasses[align])}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="shrink-0 text-white/70">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}

              {rowActions && (
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-right whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="bg-white">
                  {selectable && (
                    <td className="px-3 py-3 text-center">
                      <Skeleton variant="rect" width={16} height={16} className="mx-auto" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={`col-${col.id}`} className="px-4 py-3">
                      <Skeleton variant="text" width="80%" />
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-4 py-3 text-right">
                      <Skeleton variant="rect" width={60} height={24} className="ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="p-8 text-center"
                >
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyText}
                    action={emptyAction}
                    className="border-0 shadow-none my-0 bg-transparent"
                  />
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const key = keyExtractor(item);
                const isSelected = selectedIds.includes(key);

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      "transition-colors hover:bg-surface-hover",
                      onRowClick && "cursor-pointer",
                      isSelected && "bg-accent-light/50 hover:bg-accent-light"
                    )}
                  >
                    {selectable && (
                      <td
                        className="px-3 py-3 text-center align-middle"
                        onClick={(e) => handleSelectRow(key, e)}
                      >
                        <Checkbox
                          checked={isSelected}
                          aria-label={`Select row ${index + 1}`}
                          onChange={() => {}}
                          className="justify-center"
                        />
                      </td>
                    )}

                    {columns.map((col) => {
                      const align = col.align || "left";
                      let cellContent: React.ReactNode = null;

                      if (col.cell) {
                        cellContent = col.cell(item, index);
                      } else if (col.accessorKey) {
                        const rawValue = item[col.accessorKey];
                        cellContent = rawValue !== null && rawValue !== undefined ? String(rawValue) : "—";
                      }

                      return (
                        <td
                          key={col.id}
                          className={cn(
                            "px-4 py-3 align-middle text-xs text-text-main",
                            col.isMono && "font-mono font-medium",
                            align === "center" && "text-center",
                            align === "right" && "text-right"
                          )}
                        >
                          {cellContent}
                        </td>
                      );
                    })}

                    {rowActions && (
                      <td
                        className="px-4 py-3 text-right align-middle whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {rowActions(item)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && <Pagination {...pagination} />}
    </div>
  );
}
