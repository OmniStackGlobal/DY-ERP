export const CURRENCIES = ["USD", "CNY", "USDT", "USDC", "SGD", "HKD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

const symbols: Record<string, string> = { USD: "$", CNY: "¥", SGD: "S$", HKD: "HK$", EUR: "€", GBP: "£" };

/** 金额显示：法币带符号，稳定币后缀币种名。输入为数据库里的 numeric 字符串。 */
export function money(value: string | number | null | undefined, currency = "USD", digits = 2): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(n) ? n : 0);
  const sym = symbols[currency];
  return sym ? sym + formatted : `${formatted} ${currency}`;
}

export function number(value: string | number | null | undefined, digits = 2): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
    Number.isFinite(n) ? n : 0,
  );
}

const TZ = "Asia/Shanghai";

export function fmtDate(value: string | Date | null | undefined, style: "short" | "long" | "full" = "short"): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  if (style === "short") return new Intl.DateTimeFormat("zh-CN", { timeZone: TZ, month: "2-digit", day: "2-digit" }).format(d);
  if (style === "long")
    return new Intl.DateTimeFormat("zh-CN", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** 北京时间的今天，YYYY-MM-DD。 */
export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function monthRange(month?: string): { start: string; end: string; label: string } {
  const base = month ? new Date(month + "-01T00:00:00+08:00") : new Date();
  const y = Number(base.toLocaleDateString("en-CA", { timeZone: TZ }).slice(0, 4));
  const m = Number(base.toLocaleDateString("en-CA", { timeZone: TZ }).slice(5, 7));
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start, end: next, label: `${y} 年 ${m} 月` };
}

export function weekdayCN(d = new Date()): string {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: TZ, weekday: "long" }).format(d);
}

export function relativeTime(value: string | null | undefined): string {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} 天前`;
  return fmtDate(value, "long");
}
