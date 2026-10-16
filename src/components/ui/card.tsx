import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("card flex flex-col", className)}>{children}</section>;
}

export function CardHeader({
  title,
  caption,
  action,
  className,
}: {
  title: React.ReactNode;
  caption?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-baseline justify-between gap-3 px-5 pt-[18px] pb-3", className)}>
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {caption ? <span className="text-[12.5px] text-ink-3">{caption}</span> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center gap-3">
      <div className="flex min-w-0 flex-1 basis-[320px] flex-col">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">{title}</h1>
        {description ? <p className="text-[13px] text-ink-3">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-14 text-center", className)}>
      {icon ? (
        <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-surface-3 text-ink-3">{icon}</div>
      ) : null}
      <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      {description ? <p className="max-w-[360px] text-[13px] text-ink-3">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
