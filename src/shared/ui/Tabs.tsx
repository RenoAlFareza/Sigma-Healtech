"use client";

import React, { useState, useId, useRef } from "react";
import { cn } from "@/shared/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultTabId?: string;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  tabListClassName?: string;
  panelClassName?: string;
}

export function Tabs({
  items,
  defaultTabId,
  activeTabId: controlledActiveTabId,
  onTabChange,
  className,
  tabListClassName,
  panelClassName,
}: TabsProps) {
  const baseId = useId();
  const [internalActiveId, setInternalActiveId] = useState<string>(
    defaultTabId || items[0]?.id || ""
  );

  const activeId = controlledActiveTabId !== undefined ? controlledActiveTabId : internalActiveId;
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleSelectTab = (id: string) => {
    if (controlledActiveTabId === undefined) {
      setInternalActiveId(id);
    }
    onTabChange?.(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledItems = items.filter((item) => !item.disabled);
    const currentIndex = enabledItems.findIndex((item) => item.id === items[index].id);

    let nextItem: TabItem | undefined;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextItem = enabledItems[(currentIndex + 1) % enabledItems.length];
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nextItem = enabledItems[(currentIndex - 1 + enabledItems.length) % enabledItems.length];
    } else if (e.key === "Home") {
      e.preventDefault();
      nextItem = enabledItems[0];
    } else if (e.key === "End") {
      e.preventDefault();
      nextItem = enabledItems[enabledItems.length - 1];
    }

    if (nextItem) {
      handleSelectTab(nextItem.id);
      tabRefs.current.get(nextItem.id)?.focus();
    }
  };

  const activeItem = items.find((item) => item.id === activeId) || items[0];

  return (
    <div className={cn("w-full flex flex-col", className)}>
      {/* Tab Header List */}
      <div
        role="tablist"
        aria-label="Tabs"
        className={cn(
          "flex items-center gap-1 border-b border-border-main overflow-x-auto scrollbar-none",
          tabListClassName
        )}
      >
        {items.map((item, index) => {
          const isActive = item.id === activeId;
          const tabElementId = `${baseId}-tab-${item.id}`;
          const panelElementId = `${baseId}-panel-${item.id}`;

          return (
            <button
              key={item.id}
              ref={(el) => {
                if (el) tabRefs.current.set(item.id, el);
                else tabRefs.current.delete(item.id);
              }}
              id={tabElementId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelElementId}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              onClick={() => handleSelectTab(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 -mb-px transition-colors whitespace-nowrap select-none",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                isActive
                  ? "border-accent text-accent font-semibold"
                  : "border-transparent text-muted hover:text-text-main hover:border-border-main",
                item.disabled && "opacity-40 cursor-not-allowed border-transparent text-text-placeholder"
              )}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-mono font-medium",
                    isActive
                      ? "bg-accent-light text-accent"
                      : "bg-neutral-100 text-muted"
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panel Content */}
      {activeItem && (
        <div
          id={`${baseId}-panel-${activeItem.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${activeItem.id}`}
          tabIndex={0}
          className={cn("py-4 focus-visible:outline-none", panelClassName)}
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}
