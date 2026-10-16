import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-4 text-center">
      <span className="text-[13px] font-medium text-ink-4">404</span>
      <h1 className="text-[18px] font-semibold text-ink">没有这个页面</h1>
      <p className="text-[13px] text-ink-3">链接可能已失效，或者你没有访问权限。</p>
      <Link href="/" className="mt-2 text-[13px] font-medium text-accent">
        回到工作台
      </Link>
    </div>
  );
}
