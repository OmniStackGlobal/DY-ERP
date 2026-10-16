import { cn } from "@/lib/utils";

export type Tone = "neutral" | "green" | "amber" | "red" | "blue";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-3 text-ink-2",
  green: "bg-green-soft text-green",
  amber: "bg-amber-soft text-amber",
  red: "bg-red-soft text-red",
  blue: "bg-accent-soft text-accent",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral", className }: { tone?: Tone; className?: string }) {
  const colors: Record<Tone, string> = {
    neutral: "bg-ink-4",
    green: "bg-green",
    amber: "bg-amber-dot",
    red: "bg-red",
    blue: "bg-accent",
  };
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", colors[tone], className)} />;
}
