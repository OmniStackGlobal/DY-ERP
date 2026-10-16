/** 合并 class 名，过滤假值。 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fields?: Record<string, string> };

export function fail(error: string, fields?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fields };
}

export function errorMessage(e: unknown, fallback = "操作未完成，请重试"): string {
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
