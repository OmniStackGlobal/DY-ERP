import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/db/types";
import type { CurrentUser } from "@/lib/auth-shared";

export type { CurrentUser } from "@/lib/auth-shared";
export { roleLabel, roleDescription, ROLES } from "@/lib/auth-shared";

/** 一次请求内只读取一次当前用户。 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,name,role,is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !profile.is_active) return null;
  return { id: profile.id, email: profile.email, name: profile.name, role: profile.role };
});

/** 页面入口：未登录或已停用则送去登录页。 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Server Action 入口：角色不够直接抛错，由调用方转成提示。 */
export async function requireRole(...roles: UserRole[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("请先登录");
  if (!roles.includes(user.role)) throw new Error("没有权限执行此操作");
  return user;
}
