import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "登录" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-ink text-[14px] font-bold tracking-wide text-surface">
            DY
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[17px] font-semibold text-ink">DY ERP</span>
            <span className="text-[12.5px] text-ink-3">资金与费用工作台</span>
          </div>
        </div>
        <div className="card p-6">
          <h1 className="mb-1 text-[18px] font-semibold text-ink">登录</h1>
          <p className="mb-5 text-[13px] text-ink-3">账号由管理员创建，没有账号请联系 Roman。</p>
          <LoginForm next={next && next.startsWith("/") ? next : "/"} />
        </div>
        <p className="mt-6 text-center text-[12px] text-ink-4">内部系统 · 仅限授权人员使用</p>
      </div>
    </div>
  );
}
