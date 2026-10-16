import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap select-none transition-[background-color,color,box-shadow,opacity] duration-150 disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent shadow-raised hover:bg-accent-hover font-semibold",
  secondary: "bg-surface text-ink border border-line shadow-card hover:bg-surface-2",
  ghost: "text-ink-2 hover:bg-surface-3 hover:text-ink",
  danger: "bg-red-soft text-red border border-transparent hover:border-red/30 font-semibold",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[12.5px]",
  md: "h-[34px] px-3 text-[13px]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", loading = false, icon, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <Loader2 size={15} className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});
