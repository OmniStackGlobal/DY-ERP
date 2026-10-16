"use client";
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 右侧滑出面板，用于新建/编辑表单。
 * 打开时锁定页面滚动，Esc 关闭，点击遮罩关闭。
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 440,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-ink/30 backdrop-blur-[1px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="relative flex h-full w-full max-w-full flex-col bg-surface shadow-sheet animate-sheet-in"
        style={{ width }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-soft px-5 pt-4 pb-3">
          <div className="flex min-w-0 flex-col">
            <h2 id="sheet-title" className="text-[15px] font-semibold text-ink">
              {title}
            </h2>
            {description ? <p className="text-[12px] text-ink-3">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-surface-3 text-ink-3 hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 border-t border-line-soft px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-[9px] bg-surface-3 p-[3px]", className)} role="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-[7px] px-3 text-[13px] transition-[background-color,box-shadow,color] duration-150",
              size === "sm" ? "h-6 px-2.5 text-[12.5px]" : "h-7",
              on ? "bg-surface font-semibold text-ink shadow-raised" : "font-medium text-ink-2 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
