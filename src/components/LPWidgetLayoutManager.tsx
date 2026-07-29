'use client';

import { useState } from 'react';
import type { Widget } from '@/hooks/useLPWidgetLayout';

interface LPWidgetLayoutManagerProps {
  widgets: Widget[];
  onToggleWidget: (widgetId: string) => void;
  onReorderWidgets: (fromIndex: number, toIndex: number) => void;
  onResetLayout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function LPWidgetLayoutManager({
  widgets,
  onToggleWidget,
  onReorderWidgets,
  onResetLayout,
  isOpen,
  onClose,
}: LPWidgetLayoutManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    onReorderWidgets(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dashboard Widget Layout"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl flex flex-col gap-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label="Close widget manager"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div>
          <h2 className="text-lg font-bold text-on-surface">Widget Layout</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Show, hide, or reorder dashboard widgets
          </p>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {widgets.map((widget, index) => (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                draggedIndex === index
                  ? 'bg-primary/10 border-primary opacity-50'
                  : 'border-outline-variant/20 hover:bg-surface-container-low'
              } cursor-move`}
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                drag_handle
              </span>
              <label className="flex-1 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={widget.visible}
                  onChange={() => onToggleWidget(widget.id)}
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-sm font-medium text-on-surface">{widget.label}</span>
              </label>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-col">
          <button
            onClick={onResetLayout}
            className="w-full px-4 py-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-colors text-sm font-bold"
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-lg bg-primary text-surface-container-lowest hover:bg-primary/90 transition-colors text-sm font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
