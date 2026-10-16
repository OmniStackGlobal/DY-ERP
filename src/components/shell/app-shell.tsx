"use client";
import * as React from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import type { CurrentUser } from "@/lib/auth-shared";

export function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  return (
    <div className="flex min-h-dvh">
      <Sidebar user={user} open={open} onClose={close} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 items-center gap-2 border-b border-line bg-surface px-4 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="打开菜单" className="text-ink-2">
            <Menu size={20} />
          </button>
          <span className="text-[14px] font-semibold">DY ERP</span>
        </div>
        <main className="flex flex-1 flex-col gap-[18px] px-4 pt-[22px] pb-10 sm:px-6 lg:px-9">{children}</main>
      </div>
    </div>
  );
}
