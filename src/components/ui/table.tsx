import { cn } from "@/lib/utils";

/** 表格基础样式：细线分隔、表头浅灰小字、数字右对齐由调用方加 `tabular text-right`。 */
export function Table({ className, children, minWidth = 720 }: { className?: string; children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className={cn("w-full border-collapse text-[13.5px]", className)} style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, children, align = "left" }: { className?: string; children?: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th
      className={cn(
        "border-b border-line-soft px-3 py-2.5 text-[12px] font-medium text-ink-3 first:pl-5 last:pr-5",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, align = "left" }: { className?: string; children?: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <td
      className={cn(
        "border-b border-line-soft px-3 py-[11px] align-middle first:pl-5 last:pr-5",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr className={cn("transition-colors hover:bg-surface-2 [&:last-child>td]:border-b-0", onClick && "cursor-pointer", className)} onClick={onClick}>
      {children}
    </tr>
  );
}
