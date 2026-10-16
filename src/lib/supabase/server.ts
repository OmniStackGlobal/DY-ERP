import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createBareClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/db/types";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`缺少环境变量 ${name}`);
  return v;
}

/** 以当前登录用户身份访问数据库（受 RLS 约束）。用于页面和 Server Action。 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 在 Server Component 里调用时无法写 cookie；proxy.ts 负责刷新会话。
        }
      },
    },
  });
}

/** 服务端管理员客户端（service_role），绕过 RLS。只在明确校验过权限的 Server Action 里使用。 */
export function createAdminClient() {
  return createBareClient<Database>(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
