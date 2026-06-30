"use client";

import React, { useState, useRef, useEffect } from "react";

export interface RowAction {
  label: string;
  onClick: () => void;
  icon?: string;
}

interface RowActionsMenuProps {
  actions: RowAction[];
  ariaLabel?: string;
}

export function RowActionsMenu({ actions, ariaLabel }: RowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const firstButton = menuRef.current?.querySelector("button:not([aria-label*='Actions'])");
      (firstButton as HTMLButtonElement)?.focus();
    }
  };

  const handleActionClick = (action: RowAction) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel || "Row actions"}
        aria-expanded={isOpen}
        className="p-1 rounded hover:bg-surface-variant/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
      >
        <span className="material-symbols-outlined text-lg">more_vert</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 bg-surface-container rounded-lg shadow-lg border border-outline-variant/20 z-50 min-w-[160px]">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-surface-variant/20 transition-colors flex items-center gap-3 first:rounded-t-lg last:rounded-b-lg focus:outline-none focus:bg-surface-variant/20"
            >
              {action.icon && (
                <span className="material-symbols-outlined text-base">{action.icon}</span>
              )}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
