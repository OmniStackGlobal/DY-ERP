"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Moon, Search, Sun, Monitor, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups } from "./nav";
import { roleLabel, type CurrentUser } from "@/lib/auth-shared";
import { getBrowserClient } from "@/lib/supabase/client";

type Theme = "light" | "dark" | "system";

const THEME_EVENT = "dy-theme-change";
function readTheme(): Theme {
  try {
    const saved = localStorage.getItem("dy-theme");
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}
function subscribeTheme(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(THEME_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(THEME_EVENT, cb);
  };
}
function useTheme(): [Theme, (t: Theme) => void] {
  const theme = React.useSyncExternalStore(subscribeTheme, readTheme, () => "system" as Theme);
  const setTheme = (t: Theme) => {
    try {
      if (t === "system") {
        localStorage.removeItem("dy-theme");
        document.documentElement.removeAttribute("data-theme");
      } else {
        localStorage.setItem("dy-theme", t);
        document.documentElement.setAttribute("data-theme", t);
      }
      window.dispatchEvent(new Event(THEME_EVENT));
    } catch {}
  };
  return [theme, setTheme];
}

export function Sidebar({ user, open, onClose }: { user: CurrentUser; open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useTheme();
  const [menu, setMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menu]);

  async function signOut() {
    await getBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const visibleGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(user.role)) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {open ? <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={onClose} aria-hidden /> : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[var(--sidebar-w)] flex-col gap-4 border-r border-line bg-surface px-3.5 pt-5 pb-4 transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex size-[30px] items-center justify-center rounded-md bg-ink text-[12px] font-bold tracking-wide text-surface">
            DY
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[14px] font-semibold text-ink">DY ERP</span>
            <span className="text-[11px] text-ink-3">资金与费用工作台</span>
          </div>
          <button type="button" onClick={onClose} aria-label="收起菜单" className="ml-auto text-ink-3 lg:hidden">
            <X size={18} />
          </button>
        </div>

        <button
          type="button"
          className="flex h-[34px] w-full items-center gap-2 rounded-md bg-surface-3 px-2.5 text-[13px] text-ink-3 hover:text-ink-2"
          onClick={() => router.push("/search")}
          aria-label="搜索"
        >
          <Search size={16} />
          <span className="flex-1 text-left">搜索</span>
          <kbd className="rounded-[5px] border border-line bg-surface px-1.5 text-[11px] text-ink-4">⌘K</kbd>
        </button>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-thin">
          {visibleGroups.map((g, gi) => (
            <React.Fragment key={gi}>
              {g.label ? <div className="eyebrow px-2.5 pt-3.5 pb-1 normal-case tracking-[0.06em]">{g.label}</div> : null}
              {g.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] transition-colors",
                      active ? "bg-surface-3 font-semibold text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    <item.icon size={18} className={cn(active ? "text-ink" : "text-ink-3")} />
                    <span className="flex-1">{item.label}</span>
                    {item.soon ? <span className="text-[10.5px] font-medium text-ink-4">即将</span> : null}
                  </Link>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        <div className="relative flex flex-col gap-2.5 px-1" ref={menuRef}>
          <div className="flex items-center gap-2 px-1.5 text-[12px] text-ink-3">
            <span className="size-[7px] rounded-full bg-green" aria-hidden />
            <span>系统正常</span>
          </div>
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            className="flex w-full items-center gap-2.5 rounded-md border border-line-soft px-1.5 py-2 text-left hover:bg-surface-2"
            aria-haspopup="menu"
            aria-expanded={menu}
          >
            <span className="flex size-[30px] items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
              {initials(user.name || user.email)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[13px] font-semibold text-ink">{user.name || user.email}</span>
              <span className="text-[11.5px] text-ink-3">{roleLabel[user.role]}</span>
            </span>
            <ChevronsUpDown size={15} className="text-ink-4" />
          </button>

          {menu ? (
            <div
              role="menu"
              className="absolute bottom-[calc(100%+6px)] left-1 right-1 animate-fade-in rounded-lg border border-line bg-surface p-1.5 shadow-raised"
            >
              <div className="px-2 pt-1 pb-1.5 text-[11.5px] text-ink-3">{user.email}</div>
              <div className="px-1 pb-1.5">
                <div className="mb-1 px-1 text-[11px] font-medium text-ink-4">外观</div>
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      ["light", "浅色", Sun],
                      ["dark", "深色", Moon],
                      ["system", "跟随", Monitor],
                    ] as const
                  ).map(([v, label, Icon]) => (
                    <button
                      key={v}
                      type="button"
                      role="menuitemradio"
                      aria-checked={theme === v}
                      onClick={() => setTheme(v)}
                      className={cn(
                        "flex h-8 items-center justify-center gap-1 rounded-md text-[12px]",
                        theme === v ? "bg-surface-3 font-semibold text-ink" : "text-ink-2 hover:bg-surface-2",
                      )}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="my-1 h-px bg-line-soft" />
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-[13px] text-ink-2 hover:bg-surface-2 hover:text-ink"
              >
                <LogOut size={14} />
                退出登录
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function initials(s: string): string {
  const t = s.trim();
  if (!t) return "·";
  // 中文名取第一个字；英文取首字母
  return /[一-龥]/.test(t[0]) ? t[0] : t[0].toUpperCase();
}
